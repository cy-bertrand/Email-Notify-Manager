"""Constants — Email Notify Manager."""

DOMAIN = "email_notify_manager"

STORAGE_KEY_PREFS   = "email_notify_manager.preferences"
STORAGE_KEY_CONFIG  = "email_notify_manager.automations"
STORAGE_VERSION     = 1

CONF_AUTOMATION_ID    = "automation_id"
CONF_AUTOMATION_LABEL = "label"
CONF_ALLOWED_USERS    = "allowed_users"

DEFAULT_PREFS = {
    "enabled": False,
    "emails": [],
    "conditions": {
        "location_filter": "always",   # always | home | away | zone_in | zone_out
        "zones": [],
        "time_filter": "always",
        "time_start": "00:00",
        "time_end": "23:59",
        "days": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    },
}

DAYS_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
