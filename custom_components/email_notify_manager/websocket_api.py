"""WebSocket API — Email Notify Manager."""
from __future__ import annotations

import logging
import re

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .storage import AutomationStore, PreferencesStore

_LOGGER = logging.getLogger(__name__)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _valid_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email.strip()))


def _valid_automation_id(aid: str) -> bool:
    return bool(re.match(r"^[a-z0-9_]{1,64}$", aid))


def async_register(hass: HomeAssistant, aut_store: AutomationStore, pref_store: PreferencesStore) -> None:
    @websocket_api.websocket_command({vol.Required("type"): "enm/user/get_automations"})
    @websocket_api.async_response
    async def ws_user_get_automations(hass, connection, msg):
        user = connection.user
        user_id = user.id
        result = []
        for aut_id, aut in aut_store.get_all().items():
            allowed = aut.get("allowed_users", [])
            if not allowed or user.is_admin or user_id in allowed or user.name in allowed:
                prefs = pref_store.get_automation_prefs(user_id, aut_id)
                result.append({"automation_id": aut_id, "label": aut.get("label", aut_id), "prefs": prefs})
        zones = []
        for st in hass.states.async_all("zone"):
            zones.append({"entity_id": st.entity_id, "name": st.name or st.entity_id})
        connection.send_result(msg["id"], {"automations": result, "user_id": user_id, "zones": zones})

    @websocket_api.websocket_command({vol.Required("type"): "enm/user/save_preferences", vol.Required("automation_id"): str, vol.Required("prefs"): dict})
    @websocket_api.async_response
    async def ws_user_save_prefs(hass, connection, msg):
        user = connection.user
        user_id = user.id
        aut_id = msg["automation_id"]
        prefs = msg["prefs"]
        aut = aut_store.get(aut_id)
        if not aut:
            connection.send_error(msg["id"], "not_found", f"Automation '{aut_id}' not found")
            return
        allowed = aut.get("allowed_users", [])
        if not (not allowed or user.is_admin or user_id in allowed or user.name in allowed):
            connection.send_error(msg["id"], "unauthorized", "Access denied for this automation")
            return
        prefs["emails"] = [e.strip() for e in prefs.get("emails", []) if _valid_email(str(e))]
        cond = prefs.get("conditions", {})
        if cond.get("location_filter") not in ("always", "home", "away", "zone_in", "zone_out"):
            cond["location_filter"] = "always"
        cond["zones"] = [z for z in cond.get("zones", []) if isinstance(z, str) and z.startswith("zone.")]
        if cond.get("time_filter") not in ("always", "range"):
            cond["time_filter"] = "always"
        prefs["conditions"] = cond
        await pref_store.async_set(user_id, aut_id, prefs)
        connection.send_result(msg["id"], {"success": True})

    @websocket_api.websocket_command({vol.Required("type"): "enm/admin/get_automations"})
    @websocket_api.async_response
    async def ws_admin_get_automations(hass, connection, msg):
        if not connection.user.is_admin:
            connection.send_error(msg["id"], "unauthorized", "Admin only")
            return
        all_auts = aut_store.get_all()
        all_prefs = pref_store.get_all_for_admin()
        result = []
        for aut_id, aut in all_auts.items():
            subscriber_count = sum(1 for uid, uprefs in all_prefs.items() if uprefs.get(aut_id, {}).get("enabled", False))
            result.append({**aut, "subscriber_count": subscriber_count})
        connection.send_result(msg["id"], {"automations": result})

    @websocket_api.websocket_command({vol.Required("type"): "enm/admin/upsert_automation", vol.Required("automation_id"): str, vol.Required("label"): str, vol.Required("allowed_users"): list})
    @websocket_api.async_response
    async def ws_admin_upsert_automation(hass, connection, msg):
        if not connection.user.is_admin:
            connection.send_error(msg["id"], "unauthorized", "Admin only")
            return
        aut_id = msg["automation_id"].strip().lower()
        if not _valid_automation_id(aut_id):
            connection.send_error(msg["id"], "invalid_id", "automation_id must be lowercase alphanumeric + underscores, max 64 chars")
            return
        label = msg["label"].strip()[:120]
        allowed_users = [u.strip() for u in msg["allowed_users"] if u.strip()]
        if not label:
            connection.send_error(msg["id"], "invalid_label", "Label cannot be empty")
            return
        await aut_store.async_upsert(aut_id, label, allowed_users)
        connection.send_result(msg["id"], {"success": True, "automation_id": aut_id})

    @websocket_api.websocket_command({vol.Required("type"): "enm/admin/delete_automation", vol.Required("automation_id"): str})
    @websocket_api.async_response
    async def ws_admin_delete_automation(hass, connection, msg):
        if not connection.user.is_admin:
            connection.send_error(msg["id"], "unauthorized", "Admin only")
            return
        aut_id = msg["automation_id"]
        deleted = await aut_store.async_delete(aut_id)
        if deleted:
            await pref_store.async_delete_automation(aut_id)
        connection.send_result(msg["id"], {"success": deleted})

    @websocket_api.websocket_command({vol.Required("type"): "enm/admin/get_smtp_config"})
    @websocket_api.async_response
    async def ws_admin_get_smtp_config(hass, connection, msg):
        if not connection.user.is_admin:
            connection.send_error(msg["id"], "unauthorized", "Admin only")
            return
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            connection.send_result(msg["id"], {"configured": False})
            return
        entry = entries[0]
        cfg = dict(entry.data); cfg.update(entry.options); cfg.pop("smtp_password", None)
        connection.send_result(msg["id"], {"configured": True, "smtp": cfg})

    for cmd in [ws_user_get_automations, ws_user_save_prefs, ws_admin_get_automations,
            ws_admin_upsert_automation, ws_admin_delete_automation, ws_admin_get_smtp_config]:
        websocket_api.async_register_command(hass, cmd)

    _LOGGER.debug("Email Notify Manager: WebSocket commands registered")