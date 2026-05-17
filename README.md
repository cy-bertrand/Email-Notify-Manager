# <img width="462" height="102" alt="logo small" src="https://github.com/user-attachments/assets/16d1c7e5-e8a0-47b6-8801-267274db4bb2" />
## Email Notify Manager

## STILL IN DEVELOPMENT ##

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/cy-bertrand/email-notify-manager.svg)](https://github.com/cy-bertrand/email-notify-manager/releases)
[![Validate](https://github.com/cy-bertrand/email-notify-manager/actions/workflows/validate.yml/badge.svg)](https://github.com/cy-bertrand/email-notify-manager/actions/workflows/validate.yml)

Intégration Home Assistant permettant aux utilisateurs de **gérer individuellement leurs notifications email** depuis un panel dédié dans la sidebar.

L'administrateur configure les automations depuis son panel. Chaque utilisateur décide ensuite s'il veut recevoir les emails, vers quelles adresses, et sous quelles conditions (localisation, horaire).

---

## ✨ Fonctionnalités

| Fonctionnalité | Admin | Utilisateur |
|---|---|---|
| Créer / modifier / supprimer des automations de notification email | ✅ | — |
| Configurer le serveur SMTP | ✅ | — |
| Activer / désactiver les notifications email | — | ✅ |
| Définir ses adresses email | — | ✅ |
| Conditions de localisation (home / away) | — | ✅ |
| Conditions horaire + jours | — | ✅ |

---

## 📦 Installation via HACS

### 1. Ajouter le dépôt personnalisé

1. Ouvrez HACS → **Intégrations** → menu ⋮ → **Dépôts personnalisés**
2. URL : `https://github.com/cy-bertrand/email-notify-manager`
3. Catégorie : **Intégration**
4. Cliquez **Ajouter**

### 2. Installer

1. Recherchez **Email Notify Manager** dans HACS
2. Cliquez **Télécharger**
3. Redémarrez Home Assistant

### 3. Frontend servi automatiquement

Aucune copie manuelle du frontend n’est nécessaire. Le panel JavaScript est servi directement par l’intégration via une route statique Home Assistant.

---

## ⚙️ Configuration

### Étape 1 : Configurer le SMTP

1. **Paramètres** → **Appareils et services** → **+ Ajouter une intégration**
2. Recherchez **Email Notify Manager**
3. Renseignez vos paramètres SMTP :

| Champ | Exemple |
|---|---|
| Serveur SMTP | `smtp.xyz.com` |
| Port | `587` |
| Nom d'utilisateur | `votre@xyz.com` |
| Mot de passe | `mot_de_passe_application` |
| Adresse expéditeur | `votre@xyz.com` |
| STARTTLS | ✅ |

### Étape 2 : Créer les automations (panel admin)

1. Dans la sidebar, cliquez **Notifications Email**
2. Onglet **⚙ Administration** (visible uniquement pour les admins)
3. Cliquez **+ Nouvelle automation**
4. Renseignez :
   - **Identifiant** : `security_alert` (minuscules, chiffres, underscores)
   - **Libellé** : `Alerte sécurité — Détection mouvement`
   - **Utilisateurs autorisés** : entrez les usernames ou user_id HA

### Étape 3 : Appeler depuis une automation HA

```yaml
- service: email_notify_manager.send_email_notification
  data:
    automation_id: "security_alert"
    title: "🚨 Mouvement détecté — {{ now().strftime('%H:%M') }}"
    message: >
      Mouvement détecté le {{ now().strftime('%d/%m/%Y à %H:%M') }}.
    html_message: >
      <h2>🚨 Alerte Sécurité</h2>
      <p>Mouvement détecté à <strong>{{ now().strftime('%H:%M') }}</strong>.</p>
```

---

## 👤 Côté utilisateur

Chaque utilisateur ouvre **Notifications Email** dans la sidebar et voit uniquement les automations pour lesquelles il a été autorisé.

Pour chaque automation, il peut :

1. **Activer / désactiver** les notifications par toggle
2. **Ajouter des adresses email** (chip input — plusieurs adresses possibles)
3. **Condition localisation** :
   - Toujours
   - Uniquement si à la maison (requiert une entité `person.*` liée au compte)
   - Uniquement si absent
4. **Condition horaire** : définir une plage De/À + jours de la semaine

---

## 🔍 Trouver le user_id

**Option 1** : Paramètres → Personnes → cliquer sur l'utilisateur → l'UUID est dans l'URL  
**Option 2** : Outils développeur HA → Template : `{{ (hass.auth.async_get_user('username')) }}`  
**Option 3** : Entrez simplement le **username** HA dans le champ "Utilisateurs autorisés"

---

## 🏗️ Architecture

```
custom_components/email_notify_manager/
├── __init__.py          ← Setup, service send_email_notification
├── config_flow.py       ← Config Flow SMTP + Options Flow
├── const.py             ← Constantes
├── manifest.json        ← Métadonnées HACS/HA
├── notify_sender.py     ← Envoi SMTP natif + vérification conditions
├── storage.py           ← Persistance automations + préférences
├── strings.json         ← Traductions (source)
├── websocket_api.py     ← 7 commandes WebSocket (user + admin)
└── translations/
    ├── fr.json
    └── en.json

custom_components/email_notify_manager/static/
└── email-notify-panel.js  ← Panel frontend servi automatiquement par l’intégration

.github/workflows/
├── validate.yml           ← Validation HACS + hassfest
└── release.yml            ← Création ZIP de release
```

### Flux d'envoi

```
Automation HA
    │
    ▼ service: email_notify_manager.send_email_notification
    │   automation_id, title, message, html_message
    │
    ▼ Pour chaque utilisateur dans allowed_users :
        ├── enabled ?          non → skip
        ├── emails configurés ? non → skip
        ├── condition location? non remplie → skip
        ├── condition horaire?  non remplie → skip
        └── ▶ Envoi SMTP natif → adresses du user
```

### WebSocket API

| Commande | Accès | Description |
|---|---|---|
| `enm/user/get_automations` | Tous | Automations + prefs de l'utilisateur connecté |
| `enm/user/save_preferences` | Tous | Sauvegarde les prefs d'une automation |
| `enm/admin/get_automations` | Admin | Liste toutes les automations |
| `enm/admin/upsert_automation` | Admin | Créer ou modifier une automation |
| `enm/admin/delete_automation` | Admin | Supprimer une automation |
| `enm/admin/get_user_prefs` | Admin | Voir les prefs de tous les users |
| `enm/admin/get_smtp_config` | Admin | Vérifier la config SMTP (sans mdp) |

---

## 🐛 Dépannage

**Le panel n'apparaît pas dans la sidebar**
- Vérifiez que `/config/www/email-notify-panel.js` existe
- Videz le cache du navigateur (Ctrl+Shift+R)
- Vérifiez les logs : `ha logs | grep email_notify`

**Les emails ne sont pas envoyés**
- Vérifiez la config SMTP : Paramètres → Intégrations → Email Notify Manager → Configurer
- L'utilisateur doit avoir coché "Activer" ET renseigné ses emails dans le panel
- Consultez les logs HA pour les détails d'erreur

**Condition localisation inactive**
- Requiert une entité `person.*` avec l'attribut `user_id` correspondant au compte HA
- Configurez l'intégration "Personnes" et liez chaque personne à un compte utilisateur

**`automation_id` refusé à la création**
- Uniquement minuscules, chiffres et underscores (`_`), 1 à 64 caractères
- Exemples valides : `security_alert`, `energy_report_daily`, `heating01`

---


