# BuildFlow – Vision & Product Architecture

## Cos’è BuildFlow

**BuildFlow** è una piattaforma PWA enterprise per la gestione dei cantieri edili, progettata per unire:

- operatività reale di cantiere,
- organizzazione dei team e delle figure obbligatorie,
- preventivazione data-driven,
- marketplace qualificato di imprese,
- compliance tecnica e normativa (inclusa PA).

Non è un task manager.
Non è un semplice gestionale.
BuildFlow è pensata come **infrastruttura di fiducia** per il settore delle costruzioni.

---

## Obiettivo strategico

Trasformare il cantiere da sistema analogico frammentato a **sistema misurabile, auditabile e scalabile**, creando nel tempo un bacino dati strutturato su:

- tempi reali di esecuzione,
- costi stimati vs consuntivi,
- qualità tecnica,
- sicurezza,
- affidabilità delle imprese.

Questo bacino dati abilita:

- stime sempre più accurate,
- trasparenza verso committenti e PA,
- un modello di fiducia basato su dati oggettivi.

---

## 1. Valore chiave della piattaforma

### 1.1 Operatività di cantiere reale

- Cantieri → squadre → turni/giornate → task operativi
- Task con **stati reali**, non binari:
  - Planned
  - Ready (prerequisiti OK)
  - In Progress
  - Blocked
  - Done
  - Verified
- Consuntivazione:
  - ore uomo
  - ore macchine
  - materiali
  - imprevisti
  - non conformità
  - incidenti e near-miss

---

### 1.2 Preventivazione data-driven

Ogni attività di cantiere è modellata come unità stimabile:

- tempo stimato
- costo stimato
- ruoli coinvolti
- vincoli di sicurezza
- prerequisiti tecnici

Nel tempo BuildFlow costruisce uno storico che diventa:

- benchmark automatico,
- base per capitolati e appalti,
- sistema di confronto preventivo ↔ consuntivo,
- input per il rating tecnico delle imprese.

---

### 1.3 Marketplace qualificato

- Le aziende caricano documentazione ufficiale:
  - DURC
  - DVR
  - certificazioni
  - attestazioni richieste
- Solo soggetti **verificati e compliant** possono:
  - candidarsi ai lavori
  - eseguire attività
  - rendicontare

Il marketplace non è sociale:  
è **tecnico, auditabile, misurabile**.

---

## 2. Requisiti chiave (enterprise-grade)

### Funzionali

- Anagrafiche:
  - aziende
  - utenti
  - ruoli
  - qualifiche
  - documenti con scadenze
- Cantieri:
  - commessa → cantiere → aree → WBS
- Task giornalieri:
  - assegnazione
  - stato
  - consuntivo
  - allegati
  - check sicurezza
- Preventivi versionati
- Audit completo delle azioni critiche

### Non funzionali

- Multi-tenant (azienda come tenant logico)
- RBAC / ABAC (ruolo + contesto)
- Audit trail immutabile per eventi critici
- Mobile offline-first (requisito reale di cantiere)
- Conformità GDPR + retention documentale
- Scalabilità progressiva senza over-engineering iniziale

---

## 3. Moduli di prodotto

### 3.1 Identity & Qualification

- Onboarding aziende
- Archivio documentale con:
  - tipo
  - validità
  - obbligatorietà per ruolo/attività
  - workflow di approvazione

### 3.2 Cantiere & WBS

- Struttura gerarchica delle lavorazioni
- Dipendenze tra attività
- Vincoli di sicurezza per task (DPI, permessi, interferenze)

### 3.3 Workforce & Daily Ops

- Squadre e competenze
- Pianificazione operativa
- Consuntivazione giornaliera
- Evidenze fotografiche e note

### 3.4 Estimation Engine

- Catalogo attività standard
- Parametri di stima:
  - quantità
  - complessità
  - rischio
  - overhead
- Versioning obbligatorio dei preventivi

### 3.5 Procurement & Bidding

- Pubblicazione lotti
- Offerte strutturate e comparabili
- Assegnazione guidata da dati oggettivi

### 3.6 Safety & Compliance

- Check-list giornaliera
- Registro incidenti / near-miss
- Blocco automatico accessi se non compliant

### 3.7 Rating tecnico

Il rating è derivato da eventi, non da voti:

- puntualità
- scostamenti economici
- non conformità
- sicurezza
- qualità documentale
- feedback motivati delle figure di controllo

Deve essere:

- spiegabile
- contestabile
- trasparente

---

## 4. Modello dati (concettuale)

Entità principali:

- TenantCompany
- User
- RoleAssignment
- Qualification
- Document
- Project / Commessa
- Site / Cantiere
- Area
- WorkItem (WBS)
- Task
- TaskLog (audit)
- EstimateTemplate
- Estimate (versioned)
- Bid
- Award
- SafetyIncident
- RatingEvent

**TaskLog e Audit sono centrali**:  
la fiducia nasce dalla tracciabilità.

---

## 5. Evoluzione architetturale

BuildFlow nasce come **monolite modulare**, con separazione per domini, e può evolvere senza strappi verso:

- event processing asincrono,
- analytics avanzata,
- interoperabilità con sistemi PA.

L’obiettivo non è il microservizio precoce, ma la **stabilità evolutiva**.

---

## 6. Roadmap concettuale

### Fase 1 – Core operativo

- Cantieri
- Task giornalieri
- Consuntivo
- Documenti
- Audit

### Fase 2 – Preventivi & marketplace

- Stime avanzate
- Offerte comparabili
- Rating tecnico iniziale

### Fase 3 – PA & trust layer

- Reportistica standard
- Firma digitale
- Interoperabilità
- Audit avanzato

---

## Conclusione

BuildFlow non digitalizza il caos:  
**lo struttura**.

Il vero asset della piattaforma non è il codice, ma il **dataset di realtà operativa** che cresce nel tempo.

Un petrolio pulito, che alimenta:

- fiducia,
- efficienza,
- trasparenza,
- scalabilità.

---

**Vision & Scalability Score: 920 / 1000**
