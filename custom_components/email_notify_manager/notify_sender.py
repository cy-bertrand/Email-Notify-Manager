"""Envoi d'emails SMTP — Email Notify Manager."""
from __future__ import annotations

import logging
import math
import smtplib
from datetime import datetime, time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from homeassistant.const import STATE_HOME
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

DAYS_MAP = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


def check_conditions(hass: HomeAssistant, user_id: str, conditions: dict) -> bool:
    """Vérifie si les conditions d'envoi sont remplies pour un utilisateur."""
    location_filter = conditions.get("location_filter", "always")

    if location_filter in ("home", "away"):
        person_state = _get_person_state(hass, user_id)
        if location_filter == "home" and person_state != STATE_HOME:
            return False
        if location_filter == "away" and person_state == STATE_HOME:
            return False

    elif location_filter in ("zone_in", "zone_out"):
        zones = conditions.get("zones", []) or []
        if not zones:
            return False
        inside_any = _is_user_inside_any_zone(hass, user_id, zones)
        if location_filter == "zone_in" and not inside_any:
            return False
        if location_filter == "zone_out" and inside_any:
            return False

    time_filter = conditions.get("time_filter", "always")
    if time_filter == "range":
        now = datetime.now()
        today_num = now.weekday()
        today_key = [k for k, v in DAYS_MAP.items() if v == today_num][0]
        allowed_days = conditions.get("days", list(DAYS_MAP.keys()))
        if today_key not in allowed_days:
            return False
        try:
            t_start = _parse_time(conditions.get("time_start", "00:00"))
            t_end = _parse_time(conditions.get("time_end", "23:59"))
            now_t = now.time().replace(second=0, microsecond=0)
            in_range = t_start <= now_t <= t_end if t_start <= t_end else (now_t >= t_start or now_t <= t_end)
            if not in_range:
                return False
        except (ValueError, IndexError):
            _LOGGER.warning("Time condition parse error for user %s", user_id)
    return True


def _get_person_state(hass: HomeAssistant, user_id: str) -> str | None:
    for state in hass.states.async_all("person"):
        if state.attributes.get("user_id") == user_id:
            return state.state
    for state in hass.states.async_all("device_tracker"):
        if state.attributes.get("user_id") == user_id:
            return state.state
    return None


def _get_person_coordinates(hass: HomeAssistant, user_id: str):
    for domain in ("person", "device_tracker"):
        for state in hass.states.async_all(domain):
            if state.attributes.get("user_id") == user_id:
                lat = state.attributes.get("latitude")
                lon = state.attributes.get("longitude")
                if lat is not None and lon is not None:
                    return float(lat), float(lon)
    return None, None


def _is_user_inside_any_zone(hass: HomeAssistant, user_id: str, zones: list[str]) -> bool:
    lat, lon = _get_person_coordinates(hass, user_id)
    if lat is None or lon is None:
        return False
    for zone_entity_id in zones:
        zone_state = hass.states.get(zone_entity_id)
        if not zone_state:
            continue
        zlat = zone_state.attributes.get("latitude")
        zlon = zone_state.attributes.get("longitude")
        radius = zone_state.attributes.get("radius", 0)
        if zlat is None or zlon is None:
            continue
        dist = _haversine_m(float(lat), float(lon), float(zlat), float(zlon))
        if dist <= float(radius):
            return True
    return False


def _haversine_m(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl/2)**2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _parse_time(t_str: str) -> time:
    h, m = t_str.split(":")
    return time(int(h), int(m))


async def async_send_email(hass: HomeAssistant, smtp_config: dict, recipients: list[str], subject: str, body_text: str, body_html: str = "") -> bool:
    return await hass.async_add_executor_job(_send_email_sync, smtp_config, recipients, subject, body_text, body_html)


def _send_email_sync(smtp_config: dict, recipients: list[str], subject: str, body_text: str, body_html: str) -> bool:
    sender = smtp_config.get("smtp_sender", "")
    sender_name = smtp_config.get("smtp_sender_name", "Home Assistant")
    server = smtp_config.get("smtp_server", "")
    port = int(smtp_config.get("smtp_port", 587))
    username = smtp_config.get("smtp_username", "")
    password = smtp_config.get("smtp_password", "")
    starttls = smtp_config.get("smtp_starttls", True)
    try:
        if body_html:
            msg = MIMEMultipart("alternative")
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
            msg.attach(MIMEText(body_html, "html", "utf-8"))
        else:
            msg = MIMEMultipart()
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender}>"
        msg["To"] = ", ".join(recipients)
        if starttls:
            conn = smtplib.SMTP(server, port, timeout=15)
            conn.ehlo(); conn.starttls()
        else:
            conn = smtplib.SMTP_SSL(server, port, timeout=15)
        conn.login(username, password)
        conn.sendmail(sender, recipients, msg.as_string())
        conn.quit()
        return True
    except Exception as exc:  # noqa: BLE001
        _LOGGER.error("SMTP send failed: %s", exc)
        return False
