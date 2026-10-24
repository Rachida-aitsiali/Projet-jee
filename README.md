# 🚀 Application Web de Gestion du Laboratoire LIAS

Ce dépôt contient le code source complet de l'application web de gestion du **Laboratoire d'Informatique et Applications Scientifiques (LIAS)** de la Faculté des Sciences Ben M'Sik (FSBM), Université Hassan II de Casablanca[cite: 12]. Ce projet a été réalisé dans le cadre du module **Projet JEE** du Master **Data Science & Big Data (DSBD)** (2025-2026) sous la supervision du **Pr. BELANGOUR Abdessamad**.

---

## 🏛️ À propos du Projet

L'application centralise et digitalise l'ensemble des activités administratives et scientifiques du laboratoire à travers **21 modules fonctionnels**[cite: 12, 18], couvrant notamment :
* La gestion du cycle de vie des membres, des profils et des rôles (Admin, Directeur, Vice-Directeur, Chef d'équipe, Permanent, Associé, Doctorant)[cite: 12, 21].
* La gouvernance, les mandats et les équipes de recherche[cite: 18, 21, 22].
* Le suivi des publications et des événements scientifiques (Conférences, Séminaires, Workshops)[cite: 12, 13, 22].
* L'archivage documentaire et la gestion des procès-verbaux (PV) de réunions[cite: 12, 13, 14].
* La gestion du matériel, des conventions/collaborations et de la messagerie interne[cite: 12, 13, 14].
* La production automatisée et exportable en PDF du **rapport d'activité annuel**[cite: 12, 13, 29].

---

## 🛠️ Architecture & Technologies

La solution repose sur une architecture full-stack moderne de type **Three-Tier (SPA)**[cite: 20, 27] :

* **Backend :** 
  * Java 21 LTS[cite: 30]
  * Spring Boot 3.5 (API RESTful)[cite: 18, 27]
  * Spring Security 6.x & JWT (Authentification sécurisée avec tokens valides 24h et chiffrement BCrypt)[cite: 22, 28, 30]
  * Hibernate ORM 6.x[cite: 18, 30]
  * Maven (Gestion des dépendances)[cite: 29, 30]
* **Frontend :**
  * React 18 (Single Page Application)[cite: 18, 30]
  * Vite 5.x[cite: 29, 30]
  * React Router v6 & Axios[cite: 30]
  * Tailwind CSS / UI responsive[cite: 23, 27]
* **Base de données :**
  * PostgreSQL 17[cite: 18, 27]

---

## 📁 Structure du Dépôt

```text
.
├── lias-frontend/                 # Application Frontend (React 18 + Vite)[cite: 19, 27]
├── lias-lab/                      # Application Backend (Spring Boot 3.5 + Java 21)[cite: 12, 27]
├── Presentation_Projet_LIAS.pptx   # Présentation PowerPoint du projet
└── Rapport_Lias.pdf               # Rapport de projet officiel (Master DSBD)[cite: 9, 12]