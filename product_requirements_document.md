# Product Requirements Document (PRD)

**Project Name:** Smart Healthcare Management & AI Clinical Decision Support System  
**Version:** 1.0  
**Platform:** Web-based (Responsive Web Application)  
**Tech Stack:** React (Vite), Express.js, MongoDB, Flask, scikit-learn

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the product requirements for the "Smart Healthcare Management & AI Clinical Decision Support System." This document serves as the structural foundation for the Final Year Project (FYP) thesis, outlining the core functional modules, target roles, architectural components, and non-functional requirements of the system.

### 1.2 Product Overview
Smart Healthcare Management is an integrated clinical portal and machine learning-powered triage platform. It brings five main system roles—Patients, Doctors, Laboratories, Pharmacies, and Administrators—into a unified workflow. 

Beyond standard Electronic Health Record (EHR) features, the platform integrates an active Clinical Decision Support System (CDSS). Doctors query patient symptoms and receive probabilistic follow-up symptom suggestions (using a Symptom Co-occurrence Matrix) and machine learning-based diagnostic predictions (Random Forest Classifier). The system features a closed-loop validation engine that matches initial predictions against doctor diagnoses and objective lab results to track and improve AI accuracy.

---

## 2. Target Audience
* **Patients**: Individuals seeking digital access to medical consultations, preliminary AI-driven symptom triaging, digital prescription storage, and home-delivery medicine ordering.
* **Clinicians (Doctors)**: Medical practitioners looking to optimize their workflow with intelligent diagnostic recommendations, automatic symptom-probing tools, and seamless lab and pharmacy connectivity.
* **Laboratory Technicians**: Diagnostic center operators needing an electronic workspace to process test requests, issue quantitative findings, and log absolute diagnostic ground truth.
* **Pharmacies**: Pharmacists seeking a centralized queue to receive, verify, prepare, and deliver doctor-prescribed medications.
* **Medical Platform Administrators**: System moderators responsible for verifying clinical licenses, deactivating fraudulent accounts, and auditing the live accuracy metrics of decision support models.

---

## 3. Core Features & Functional Requirements

### 3.1 User Authentication & Profile Management (RBAC)
The system operates on Role-Based Access Control (RBAC) with secure, tokenized sessions.
* **Unified Database Schema**: Roles share a baseline account schema (name, email, password, phone) with specialized sub-attributes (e.g., age and blood group for patients; qualification and licensing numbers for doctors, labs, and pharmacies).
* **Onboarding & Moderation Pipeline**: Patient accounts are instantly approved upon registration. Doctor, laboratory, and pharmacy accounts are held in a `pending` state, locked from system entry until checked and approved by an Administrator.

### 3.2 Appointment Booking & Management System
Enables appointment scheduling and diagnostic lifecycle management.
* **Scheduling**: Patients search for approved doctors by specialization and submit date-and-time requests (setting status to `pending`).
* **Inbox**: Doctors can accept (status updates to `accepted`) or reject (specifying a reason) incoming consultation requests.

### 3.3 Interactive AI Consultation Workspace (CDSS)
The core decision-support workbench used by doctors during clinical consults.
* **Symptom Input & Search**: A search dropdown indexing 131 clinical symptoms (e.g., `high_fever`, `joint_pain`).
* **Active Probing (Symptom Co-occurrence)**: Generates 4 to 6 conditional follow-up questions to query additional symptoms with high statistical probabilities of co-occurrence.
* **Differential Predictions**: Displays the top 5 predicted diseases, confidence percentages, severity indicators, suggested medications, and precautions.
* **Clinical Comparison**: Doctors enter their independent clinical diagnosis. The system records the agreement state (`MATCH` or `MISMATCH`) between the AI model and the clinician.

### 3.4 Diagnostic Laboratory Module & Verification
Bridges clinical predictions with laboratory confirmation.
* **Ordering**: Doctors can request specific laboratory tests directly from the consultation workspace.
* **Report Compilation**: Laboratories receive requests, update status to `in_progress`, compile quantitative findings, upload PDF/image test results, and input the lab-confirmed disease.
* **Closed-loop Validation Callback**: Submitting the report triggers a backend request to `/api/ai/validate`, comparing:
  $$\text{AI Prediction} \longleftrightarrow \text{Doctor Diagnosis} \longleftrightarrow \text{Lab Ground Truth}$$
  This dynamically updates the model's accuracy, match status, and logs discrepancy metrics.

### 3.5 E-Pharmacy & Medication Dispatch Module
Manages digital prescription fulfillment.
* **E-Prescription Creation**: Doctors write structured prescriptions detailing diagnosis, medicine names, dosage, frequency, duration, and instructions.
* **Order Placement**: Patients select active prescriptions on their dashboard and route them to partner pharmacies.
* **Dispensing Stages**: Pharmacies process medicine preparation through operational states: `pending` $\rightarrow$ `preparing` $\rightarrow$ `ready` $\rightarrow$ `delivered`.

### 3.6 Admin Moderation & AI Performance Panel
* **Validation Desk**: Allows administrators to approve or reject pending doctor, lab, or pharmacy profiles.
* **AI Metrics Audits**: Displays global accuracy, evaluations count, mismatch ratios, and error tracking.
* **Batch Model Retraining**: Triggered by the admin to retrain the Random Forest model on historical validation data.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Responsiveness
* **Response Latency**: AI predictions and symptom suggestions must resolve in under 1 second.
* **Database Operations**: Query execution times for MongoDB documents must remain under 200ms using index optimization.
* **State Updates**: React dashboards must reflect order, test request, and appointment status updates in real-time.

### 4.2 Data Storage & Security
* **Access Security**: Secure password storage using `bcryptjs` hashing (12 rounds) and session authentication using JSON Web Tokens (JWT).
* **Database Integrity**: Schema validations on the MongoDB layer utilizing Mongoose models.
* **Operational Decoupling**: AI pipelines are isolated in separate Flask processes to ensure backend transactions are unaffected during heavy training loads.

### 4.3 UI/UX Design & Medical Compliance
* **Interface**: Premium responsive web design utilizing modern dark/light card elements and Tailwind CSS.
* **Disclaimers**: Every AI prediction screen must display standard liability disclaimers and include HTTP security response headers (`X-Medical-Disclaimer`).

---

## 5. Technology Stack & Architecture

### 5.1 Frontend (User Interface)
* **Framework**: React 19 (compiled via Vite)
* **Styling**: Tailwind CSS 4
* **State & Routing**: React Router 7, React Context API (Auth state)
* **API Handler**: Axios Client

### 5.2 Backend & Data Persistence
* **Primary Server**: Node.js, Express.js
* **AI Services**: Python 3.x, Flask (Port 5001 for patient predictions, Port 5002 for advanced CDSS)
* **Database**: MongoDB (NoSQL) using Mongoose ODM

### 5.3 Key Dependencies
* **scikit-learn & joblib**: For loading and querying the Random Forest Classifier.
* **pandas & numpy**: For vector manipulation and training pipelines.
* **jsonwebtoken & bcryptjs**: For security.

---

## 6. Future Enhancements (Post-MVP)
* **Real-time WebSockets Integration**: Incorporating Socket.io for instant messaging, appointment requests, and delivery dispatch alerts.
* **LLM Patient Conversational Bot**: Integrating a Large Language Model (LLM) chatbot on the patient portal to offer conversational symptom triage before booking.
* **Mobile Application Deployment**: Packaging the React codebase using React Native or Capacitor for Android and iOS app stores.
