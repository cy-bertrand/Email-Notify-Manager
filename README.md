# <img width="462" height="102" alt="logo small" src="https://github.com/user-attachments/assets/16d1c7e5-e8a0-47b6-8801-267274db4bb2" />

[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/cy-bertrand/email-notify-manager.svg)](https://github.com/cy-bertrand/email-notify-manager/releases)
[![Validate](https://github.com/cy-bertrand/email-notify-manager/actions/workflows/validate.yml/badge.svg)](https://github.com/cy-bertrand/email-notify-manager/actions/workflows/validate.yml)

<a href="https://www.buymeacoffee.com/cybertrand" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Brain" height="41" width="174"></a>

# Email Notify Manager

[Français](#français) | [English](#english)

Home Assistant integration allowing each user to manage their email notifications from a dedicated sidebar panel. Administrators create the automations, and users choose whether to receive emails, to which addresses, and under which conditions.

<a id="français"></a>
## Français

Intégration Home Assistant permettant à chaque utilisateur de **gérer individuellement ses notifications email** depuis un panneau dédié dans la barre latérale.  
L'administrateur configure les automations depuis le panneau d'administration. Chaque utilisateur choisit ensuite s'il souhaite recevoir les emails, sur quelles adresses et sous quelles conditions (localisation, horaire).

---

## ✨ Fonctionnalités

| Fonction | Admin | Utilisateur |
|---|---|---|
| Créer / modifier / supprimer des automations email | ✅ | — |
| Configurer le serveur SMTP | ✅ | — |
| Activer / désactiver les emails | — | ✅ |
| Définir les adresses email | — | ✅ |
| Conditions de localisation (maison / absent / zones) | — | ✅ |
| Conditions horaires + jours de semaine | — | ✅ |

---

## 📦 Installation via HACS

### 1. HACS (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=cy-bertrand&repository=Email-Notify-Manager&category=integration)

1. Rechercher **Email Notify Manager** dans HACS
2. Cliquer sur **Télécharger**
3. Redémarrer Home Assistant

### 2. Ou ... Ajouter le dépôt custom

1. Ouvrir HACS → **Intégrations** → menu ⋮ → **Dépôts personnalisés**
2. URL : `https://github.com/cy-bertrand/email-notify-manager`
3. Catégorie : **Integration**
4. Cliquer sur **Ajouter**

### 3. Frontend servi automatiquement

Aucune copie manuelle du frontend n'est nécessaire. Le panneau JavaScript est servi directement par l'intégration via une route statique Home Assistant.

---

## ⚙️ Configuration

### Étape 1 : Configurer le SMTP

1. **Paramètres** → **Appareils et services** → **+ Ajouter une intégration**
2. Rechercher **Email Notify Manager**
3. Entrer vos paramètres SMTP :

| Champ | Exemple |
|---|---|
| Serveur SMTP | `smtp.xyz.com` |
| Port | `587` |
| Nom d'utilisateur | `your@xyz.com` |
| Mot de passe | `app_password` |
| Adresse expéditeur | `your@xyz.com` |
| STARTTLS | ✅ |

### Étape 2 : Créer les automations (panneau admin)

1. Dans la barre latérale, cliquer sur **Email Notify Manager**
2. Ouvrir l'onglet **⚙ Administration** (visible uniquement pour les admins)
3. Cliquer sur **+ Nouvelle automation**
4. Remplir :
   - **Identifiant** : `security_alert` (minuscules, chiffres, underscores)
   - **Libellé** : `Alerte sécurité — Détection mouvement`
   - **Utilisateurs autorisés** : entrer les [usernames HA ou les user_id](#user_id)

--

<img width="753" height="573" alt="image" src="https://github.com/user-attachments/assets/18dd84c5-d085-417b-b162-91e56e3356b6" />


### Étape 3 : L'appeler depuis une automation Home Assistant

Exemple :

```yaml
- service: email_notify_manager.send_email_notification
  data:
    automation_id: "security_alert"
    title: "🚨 Mouvement détecté — {{ now().strftime('%H:%M') }}"
    message: >
      Mouvement détecté le {{ now().strftime('%d/%m/%Y à %H:%M') }}.
    html_message: >
      <h2>🚨 Alerte sécurité</h2>
      <p>Mouvement détecté à <strong>{{ now().strftime('%H:%M') }}</strong>.</p>
```

---

## 👤 Côté utilisateur

Chaque utilisateur ouvre **Email Notify Manager** dans la barre latérale et voit uniquement les automations auxquelles il est autorisé.

Pour chaque automation, il peut :

1. **Activer / désactiver** les notifications avec un toggle
2. **Ajouter ses adresses email** (champ type chips, plusieurs adresses possibles)
3. **Condition de localisation** :
   - Toujours
   - Uniquement si à la maison (nécessite une entité `person.*` liée au compte)
   - Uniquement si absent
   - Uniquement dans certaines zones
   - Uniquement hors de certaines zones
4. **Condition horaire** : définir une plage De/À + les jours de semaine

--

<img width="728" height="839" alt="image" src="https://github.com/user-attachments/assets/920ba753-1842-4297-aa1f-4ab13c57e3fd" />


---
<a id="user_id"></a>
## 🔍 Trouver le `user_id`

**Option 1** : entrer simplement le **username HA** dans le champ "Utilisateurs autorisés". Attention à la casse.  
**Option 2** : Paramètres → Personnes → cliquer sur l'utilisateur → l'UUID est dans l'URL.  
**Option 3** : Outils de développement HA → Template : `{{ (hass.auth.async_get_user('username')) }}`

---

## 🏗️ Architecture

```text
custom_components/email_notify_manager/
├── __init__.py          ← Setup, service send_email_notification
├── config_flow.py       ← Config Flow SMTP + Options Flow
├── const.py             ← Constantes
├── manifest.json        ← Métadonnées HACS/HA
├── notify_sender.py     ← Envoi SMTP natif + vérification des conditions
├── storage.py           ← Persistance des automations + préférences
├── strings.json         ← Traductions (source)
├── websocket_api.py     ← commandes WebSocket (user + admin)
└── translations/
    ├── fr.json
    └── en.json

custom_components/email_notify_manager/static/
└── email-notify-panel.js  ← Frontend panel servi automatiquement par l'intégration /  inclus les traductions du panel

.github/workflows/
├── validate.yml           ← Validation HACS + hassfest
└── release.yml            ← Création du ZIP de release
```

### Flux d'envoi

```text
Automation HA
    │
    ▼ service: email_notify_manager.send_email_notification
    │   automation_id, title, message, html_message
    │
    ▼ Pour chaque utilisateur dans allowed_users:
        ├── enabled?            non → skip
        ├── emails configurés?  non → skip
        ├── condition de lieu?  non respectée → skip
        ├── condition horaire?  non respectée → skip
        └── ▶ Envoi SMTP natif → adresses email de l'utilisateur
```

### API WebSocket

| Commande | Accès | Description |
|---|---|---|
| `enm/user/get_automations` | Tous | Automations + préférences de l'utilisateur connecté |
| `enm/user/save_preferences` | Tous | Sauvegarder les préférences d'une automation |
| `enm/admin/get_automations` | Admin | Lister toutes les automations |
| `enm/admin/upsert_automation` | Admin | Créer ou modifier une automation |
| `enm/admin/delete_automation` | Admin | Supprimer une automation |
| `enm/admin/get_user_prefs` | Admin | Voir les préférences de tous les utilisateurs |
| `enm/admin/get_smtp_config` | Admin | Vérifier la configuration SMTP (sans mot de passe) |

---

## 🐛 Dépannage

**Le panneau n'apparaît pas dans la sidebar**
- Vérifier que l'intégration est bien chargée et que la route statique du panel est accessible
- Vider le cache navigateur (`Ctrl+Shift+R`)
- Vérifier les logs HA : `ha logs | grep email_notify`

**Les emails ne partent pas**
- Vérifier la configuration SMTP : Paramètres → Intégrations → Email Notify Manager → Configurer
- L'utilisateur doit avoir activé la notification et saisi au moins une adresse email dans le panel
- Vérifier les logs HA pour le détail de l'erreur

**La condition de localisation ne fonctionne pas**
- Nécessite une entité `person.*` avec un attribut `user_id` correspondant au compte HA
- Configurer l'intégration "People" et lier chaque personne à un compte utilisateur

**`automation_id` refusé à la création**
- Uniquement des minuscules, chiffres, underscores (`_`), 1 à 64 caractères
- Exemples valides : `security_alert`, `energy_report_daily`, `heating01`

---

<a id="english"></a>
## English

<a href="https://www.buymeacoffee.com/cybertrand" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Brain" height="41" width="174"></a>

[Français](#français) | [English](#english)

Home Assistant integration allowing users to **manage their email notifications individually** from a dedicated panel in the sidebar.  
The administrator configures automations from the admin panel. Each user then decides whether they want to receive emails, to which addresses, and under which conditions (location, schedule).

---

## ✨ Features

| Feature | Admin | User |
|---|---|---|
| Create / edit / delete email notification automations | ✅ | — |
| Configure the SMTP server | ✅ | — |
| Enable / disable email notifications | — | ✅ |
| Define email addresses | — | ✅ |
| Location conditions (home / away / zones) | — | ✅ |
| Time conditions + weekdays | — | ✅ |

---

## 📦 Installation via HACS

### 1. HACS (recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=cy-bertrand&repository=Email-Notify-Manager&category=integration)

1. Search for **Email Notify Manager** in HACS
2. Cliquer sur **Downloadr**
3. Restart Home Assistant

### 2. Or... Add the custom repository

1. Open HACS → **Integrations** → ⋮ menu → **Custom repositories**
2. URL: `https://github.com/cy-bertrand/email-notify-manager`
3. Category: **Integration**
4. Click **Add**

### 3. Frontend served automatically

No manual frontend copy is required. The JavaScript panel is served directly by the integration through a Home Assistant static route.

---

## ⚙️ Configuration

### Step 1: Configure SMTP

1. **Settings** → **Devices & Services** → **+ Add Integration**
2. Search for **Email Notify Manager**
3. Enter your SMTP settings:

| Field | Example |
|---|---|
| SMTP server | `smtp.xyz.com` |
| Port | `587` |
| Username | `your@xyz.com` |
| Password | `app_password` |
| Sender address | `your@xyz.com` |
| STARTTLS | ✅ |

### Step 2: Create automations (admin panel)

1. In the sidebar, click **Email Notify Manager**
2. Open the **⚙ Administration** tab (visible only to admins)
3. Click **+ New automation**
4. Fill in:
   - **Identifier**: `security_alert` (lowercase, numbers, underscores)
   - **Label**: `Security Alert — Motion Detection`
   - **Allowed users**: enter HA usernames or user IDs
--

<img width="753" height="573" alt="image" src="https://github.com/user-attachments/assets/18dd84c5-d085-417b-b162-91e56e3356b6" />


### Step 3: Call it from a Home Assistant automation

Example:

```yaml
- service: email_notify_manager.send_email_notification
  data:
    automation_id: "security_alert"
    title: "🚨 Motion detected — {{ now().strftime('%H:%M') }}"
    message: >
      Motion detected on {{ now().strftime('%d/%m/%Y at %H:%M') }}.
    html_message: >
      <h2>🚨 Security Alert</h2>
      <p>Motion detected at <strong>{{ now().strftime('%H:%M') }}</strong>.</p>
```

---

## 👤 User side

Each user opens **Email Notify Manager** in the sidebar and only sees the automations they are allowed to access.

For each automation, they can:

1. **Enable / disable** notifications with a toggle
2. **Add email addresses** (chip input, multiple addresses supported)
3. **Location condition**:
   - Always
   - Only if at home (requires a `person.*` entity linked to the account)
   - Only if away
   - Only in selected zones
   - Only outside selected zones
4. **Time condition**: define a From/To range + weekdays

--

<img width="728" height="839" alt="image" src="https://github.com/user-attachments/assets/920ba753-1842-4297-aa1f-4ab13c57e3fd" />


---

## 🔍 Finding the `user_id`

**Option 1**: simply enter the HA **username** in the "Allowed users" field. Be careful with case sensitivity.  
**Option 2**: Settings → People → click the user → the UUID is in the URL.  
**Option 3**: HA Developer Tools → Template: `{{ (hass.auth.async_get_user('username')) }}`

---

## 🏗️ Architecture

```text
custom_components/email_notify_manager/
├── __init__.py          ← Setup, send_email_notification service
├── config_flow.py       ← SMTP Config Flow + Options Flow
├── const.py             ← Constants
├── manifest.json        ← HACS/HA metadata
├── notify_sender.py     ← Native SMTP sending + condition checks
├── storage.py           ← Automation + preferences persistence
├── strings.json         ← Translations (source)
├── websocket_api.py     ← WebSocket commands (user + admin)
└── translations/
    ├── fr.json
    └── en.json

custom_components/email_notify_manager/static/
└── email-notify-panel.js  ← Frontend panel automatically served by the integration / including panel translations

.github/workflows/
├── validate.yml           ← HACS + hassfest validation
└── release.yml            ← Release ZIP creation
```

### Sending flow

```text
HA Automation
    │
    ▼ service: email_notify_manager.send_email_notification
    │   automation_id, title, message, html_message
    │
    ▼ For each user in allowed_users:
        ├── enabled?            no → skip
        ├── emails configured?  no → skip
        ├── location condition? not matched → skip
        ├── time condition?     not matched → skip
        └── ▶ Native SMTP send → user's email addresses
```

### WebSocket API

| Command | Access | Description |
|---|---|---|
| `enm/user/get_automations` | All | Automations + preferences for the logged-in user |
| `enm/user/save_preferences` | All | Save preferences for one automation |
| `enm/admin/get_automations` | Admin | List all automations |
| `enm/admin/upsert_automation` | Admin | Create or update an automation |
| `enm/admin/delete_automation` | Admin | Delete an automation |
| `enm/admin/get_user_prefs` | Admin | View preferences for all users |
| `enm/admin/get_smtp_config` | Admin | Check SMTP configuration (without password) |

---

## 🐛 Troubleshooting

**The panel does not appear in the sidebar**
- Check that the integration is loaded correctly and that the static panel route is reachable
- Clear the browser cache (`Ctrl+Shift+R`)
- Check HA logs: `ha logs | grep email_notify`

**Emails are not being sent**
- Check SMTP configuration: Settings → Integrations → Email Notify Manager → Configure
- The user must have enabled notifications and entered at least one email address in the panel
- Check HA logs for the detailed error

**Location condition does not work**
- Requires a `person.*` entity with a `user_id` attribute matching the HA account
- Configure the People integration and link each person to a user account

**`automation_id` rejected on creation**
- Only lowercase letters, numbers, and underscores (`_`), 1 to 64 characters
- Valid examples: `security_alert`, `energy_report_daily`, `heating01`

