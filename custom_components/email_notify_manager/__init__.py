"""Email Notify Manager."""
from __future__ import annotations

import logging
from pathlib import Path
from unittest.mock import call

import voluptuous as vol
from aiohttp import web
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import frontend
from homeassistant.components.frontend import add_extra_js_url  # pour ajouter le fichier js de l'icone custom dans le frontend de HA

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

    add_extra_js_url(hass, f"/api/email_notify_manager/static/enm-logo.js") # ce fichier JS contient l'enregistrement de l'icone custom "enm:logo" utilisée dans le panneau

    async def handle_send_email(call: ServiceCall) -> None:
        automation_id = call.data[CONF_AUTOMATION_ID]
        title = call.data[ATTR_TITLE]
        message = call.data["message"]
        html_message = call.data.get("html_message", "")

        aut = aut_store.get(automation_id)
        if not aut:
            _LOGGER.error("Automation '%s' introuvable dans ENM admin panel", automation_id)
            return

        smtp_cfg = dict(entry.data)
        smtp_cfg.update(entry.options)
        if not smtp_cfg.get("smtp_server"):
            _LOGGER.error("SMTP non configurÃ©")
            return

        allowed_users = aut.get("allowed_users", [])  # noms OU UUIDs definis par l'admin
        sent_count = 0

        # Resolution : mapper les noms vers les vrais user_id (UUID) de HA
        ha_users = await hass.auth.async_get_users()
        if not allowed_users:
            # Aucune restriction pour tous les utilisateurs non-system
            target_user_ids = [u.id for u in ha_users if not u.system_generated]
        else:
            # Matcher par UUID ou par nom
            target_user_ids = [
                u.id for u in ha_users
                if u.id in allowed_users or u.name in allowed_users
            ]

        _LOGGER.debug(
            "send_email_notification '%s': allowed_users=%r â†’ target_user_ids=%r",
            automation_id, allowed_users, target_user_ids
        )

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

        _LOGGER.info(
            "send_email_notification '%s': envoyÃ© Ã  %d utilisateur(s)", 
            automation_id, sent_count
        )

    hass.services.async_register(DOMAIN, "send_email_notification", handle_send_email, schema=SEND_SERVICE_SCHEMA)
    register_ws(hass, aut_store, pref_store)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Email Notify Manager",
        # sidebar_icon="mdi:email-check-outline",
        sidebar_icon="enm:logo",
        frontend_url_path="email-notify-manager",
        config={"_panel_custom": {"name": "email-notify-panel", "module_url": "/api/email_notify_manager/static/email-notify-panel.js?v=3.3.0"}}, # ajout d'un versionnage pour forcer le rechargement du JS chaque mise a jour
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