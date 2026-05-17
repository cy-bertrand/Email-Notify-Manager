"""Config Flow — Email Notify Manager."""
from __future__ import annotations

import smtplib
import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.config_entries import ConfigFlowResult

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema({
    vol.Required("smtp_server", default="smtp.xyz.com"): str,
    vol.Required("smtp_port", default=587): vol.All(int, vol.Range(min=1, max=65535)),
    vol.Required("smtp_username"): str,
    vol.Required("smtp_password"): str,
    vol.Required("smtp_sender"): str,
    vol.Optional("smtp_sender_name", default="Home Assistant"): str,
    vol.Optional("smtp_starttls", default=True): bool,
})


def _test_smtp(data: dict) -> str | None:
    """Teste la connexion SMTP. Retourne None si OK, sinon un code d'erreur."""
    try:
        if data["smtp_starttls"]:
            server = smtplib.SMTP(data["smtp_server"], data["smtp_port"], timeout=10)
            server.ehlo()
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(data["smtp_server"], data["smtp_port"], timeout=10)
        server.login(data["smtp_username"], data["smtp_password"])
        server.quit()
        return None
    except smtplib.SMTPAuthenticationError:
        return "invalid_auth"
    except (smtplib.SMTPException, OSError, TimeoutError):
        return "cannot_connect"
    except Exception:  # noqa: BLE001
        return "unknown"


class EmailNotifyManagerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Gestion du Config Flow pour Email Notify Manager."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")

        errors: dict[str, str] = {}

        if user_input is not None:
            error = await self.hass.async_add_executor_job(_test_smtp, user_input)
            if error:
                errors["base"] = error
            else:
                return self.async_create_entry(
                    title="Email Notify Manager",
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return EmailNotifyManagerOptionsFlow(config_entry)


class EmailNotifyManagerOptionsFlow(config_entries.OptionsFlow):
    """Options Flow (re-configuration SMTP)."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        current = dict(self._config_entry.data)
        current.update(self._config_entry.options)

        if user_input is not None:
            error = await self.hass.async_add_executor_job(_test_smtp, user_input)
            if error:
                errors["base"] = error
            else:
                return self.async_create_entry(title="", data=user_input)

        schema = vol.Schema({
            vol.Required("smtp_server", default=current.get("smtp_server", "smtp.xyz.com")): str,
            vol.Required("smtp_port", default=current.get("smtp_port", 587)): vol.All(int, vol.Range(min=1, max=65535)),
            vol.Required("smtp_username", default=current.get("smtp_username", "")): str,
            vol.Required("smtp_password", default=current.get("smtp_password", "")): str,
            vol.Required("smtp_sender", default=current.get("smtp_sender", "")): str,
            vol.Optional("smtp_sender_name", default=current.get("smtp_sender_name", "Home Assistant")): str,
            vol.Optional("smtp_starttls", default=current.get("smtp_starttls", True)): bool,
        })

        return self.async_show_form(
            step_id="init",
            data_schema=schema,
            errors=errors,
        )
