"""Storage helpers — Email Notify Manager."""
from __future__ import annotations

import copy
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    STORAGE_KEY_PREFS,
    STORAGE_KEY_CONFIG,
    STORAGE_VERSION,
    DEFAULT_PREFS,
)

_LOGGER = logging.getLogger(__name__)


class AutomationStore:
    """Persistance des automations définies par l'admin."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY_CONFIG)
        self._data: dict[str, dict] = {}   # automation_id → {label, allowed_users}

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        self._data = stored if isinstance(stored, dict) else {}

    async def async_save(self) -> None:
        await self._store.async_save(self._data)

    # ── Read ────────────────────────────────────────────────────────────────────

    def get_all(self) -> dict[str, dict]:
        return copy.deepcopy(self._data)

    def get(self, automation_id: str) -> dict | None:
        return copy.deepcopy(self._data.get(automation_id))

    def exists(self, automation_id: str) -> bool:
        return automation_id in self._data

    # ── Write ───────────────────────────────────────────────────────────────────

    async def async_upsert(self, automation_id: str, label: str, allowed_users: list[str]) -> None:
        self._data[automation_id] = {
            "automation_id": automation_id,
            "label": label,
            "allowed_users": allowed_users,
        }
        await self.async_save()

    async def async_delete(self, automation_id: str) -> bool:
        if automation_id not in self._data:
            return False
        del self._data[automation_id]
        await self.async_save()
        return True


class PreferencesStore:
    """Persistance des préférences utilisateur par automation."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY_PREFS)
        self._data: dict[str, dict] = {}   # user_id → {automation_id → prefs}

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        self._data = stored if isinstance(stored, dict) else {}

    async def async_save(self) -> None:
        await self._store.async_save(self._data)

    def get_user(self, user_id: str) -> dict:
        return copy.deepcopy(self._data.get(user_id, {}))

    def get_automation_prefs(self, user_id: str, automation_id: str) -> dict:
        return copy.deepcopy(
            self._data.get(user_id, {}).get(automation_id, copy.deepcopy(DEFAULT_PREFS))
        )

    async def async_set(self, user_id: str, automation_id: str, prefs: dict) -> None:
        if user_id not in self._data:
            self._data[user_id] = {}
        self._data[user_id][automation_id] = prefs
        await self.async_save()

    async def async_delete_automation(self, automation_id: str) -> None:
        """Supprime les prefs de tous les users pour cette automation."""
        for user_id in self._data:
            self._data[user_id].pop(automation_id, None)
        await self.async_save()

    def get_all_for_admin(self) -> dict:
        return copy.deepcopy(self._data)
