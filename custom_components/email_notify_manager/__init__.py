"""Email Notify Manager."""
from __future__ import annotations

import logging
# import time     # temporaire pour forcer le rechargement du JS du frontend lors des mises à jour
from pathlib import Path

import voluptuous as vol
from aiohttp import web
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import frontend

from .const import DOMAIN, CONF_AUTOMATION_ID, ATTR_TITLE
from .storage import AutomationStore, PreferencesStore
from .notify_sender import check_conditions, async_send_email
from .websocket_api import async_register as register_ws

_LOGGER = logging.getLogger(__name__)

SEND_SERVICE_SCHEMA = vol.Schema({
    vol.Required(CONF_AUTOMATION_ID): cv.string,
    vol.Required(ATTR_TITLE): cv.string,
    vol.Required("message"): cv.string,
    vol.Optional("html_message", default=""): cv.string,
})


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    aut_store = AutomationStore(hass)
    pref_store = PreferencesStore(hass)
    await aut_store.async_load()
    await pref_store.async_load()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN] = {"aut_store": aut_store, "pref_store": pref_store, "entry": entry}

    static_dir = Path(__file__).parent / "static"
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path="/api/email_notify_manager/static",
            path=str(static_dir),
            cache_headers=False,
        )
    ])

    async def handle_send_email(call: ServiceCall) -> None:
        automation_id = call.data[CONF_AUTOMATION_ID]
        title = call.data[ATTR_TITLE]
        message = call.data["message"]
        html_message = call.data.get("html_message", "")
        aut = aut_store.get(automation_id)
        if not aut:
            _LOGGER.error("Automation '%s' introuvable dans ENM admin panel", automation_id)
            return
        smtp_cfg = dict(entry.data); smtp_cfg.update(entry.options)
        if not smtp_cfg.get("smtp_server"):
            _LOGGER.error("SMTP non configuré")
            return
        allowed_users = aut.get("allowed_users", [])
        sent_count = 0
        target_user_ids = allowed_users
        for user_id in target_user_ids:
            prefs = pref_store.get_automation_prefs(user_id, automation_id)
            if not prefs.get("enabled", False):
                continue
            emails = [e for e in prefs.get("emails", []) if e]
            if not emails:
                continue
            if not check_conditions(hass, user_id, prefs.get("conditions", {})):
                continue
            if await async_send_email(hass, smtp_cfg, emails, title, message, html_message):
                sent_count += 1
        _LOGGER.info("send_email_notification '%s': envoyé à %d utilisateur(s)", automation_id, sent_count)

    hass.services.async_register(DOMAIN, "send_email_notification", handle_send_email, schema=SEND_SERVICE_SCHEMA)
    register_ws(hass, aut_store, pref_store)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Notifications Email",
        sidebar_icon="mdi:email-alert-outline",
        frontend_url_path="email-notify-manager",
        config={"_panel_custom": {"name": "email-notify-panel", "module_url": "/api/email_notify_manager/static/email-notify-panel.js?v=3.1.0"}}, # ajout d'un versionnage pour forcer le rechargement du JS à chaque mise à jour
        #config={"_panel_custom": {"name": "email-notify-panel", "module_url": "/api/email_notify_manager/static/email-notify-panel.js?v=" + str(time.time())}}, # temporaire ajout d'un timestamp pour forcer le rechargement du JS à chaque mise à jour
        require_admin=False,
    )
    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.services.async_remove(DOMAIN, "send_email_notification")
    frontend.async_remove_panel(hass, "email-notify-manager")
    hass.data.pop(DOMAIN, None)
    return True
