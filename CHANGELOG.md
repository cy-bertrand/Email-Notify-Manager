# Changelog

## [3.1.0] - 2025-05-15

### Changed
- Package nettoyé pour publication: suppression du doublon `www/email-notify-panel.js`
- La version publiée conserve uniquement le frontend servi automatiquement depuis `custom_components/email_notify_manager/static/`

## [3.0.0] - 2025-05-15

### Added
- Conditions de localisation par zones avec deux modes : **IN zone** et **OUT of zone**
- Liste des zones Home Assistant récupérée dynamiquement et proposée dans le panel utilisateur
- Frontend servi automatiquement par l’intégration, plus besoin de copier le fichier JS dans `/config/www`

## [2.0.0] - 2025-05-15

### Added
- Panel **admin** intégré : créer, modifier et supprimer des automations directement depuis l'UI
- Plus besoin de définir les automations dans `configuration.yaml`
- Config Flow : configuration SMTP depuis l'interface HA (Paramètres → Intégrations)
- Options Flow : modifier les paramètres SMTP sans redémarrage
- Panel utilisateur : onglet dédié visible uniquement si automations disponibles
- Compteur d'abonnés actifs dans le panel admin
- Validation côté serveur des automation_id et des emails
- Suppression d'une automation nettoie toutes les préférences utilisateurs associées
- Envoi SMTP natif (plus de dépendance sur `notify.smtp`)
- WebSocket API sécurisée : 7 commandes (user + admin)
- Workflow GitHub Actions : validation HACS + hassfest + release automatique

## [1.0.0] - 2025-05-01

### Added
- Version initiale
- Automations définies dans `configuration.yaml`
- Panel utilisateur simple (activer/désactiver, emails, conditions)
- Service `send_email_notification`
