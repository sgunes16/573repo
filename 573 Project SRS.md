# Software Requirements Specification (SRS)

**Project Title:** The Hive: A Community-Oriented Service Offering Platform

**Version:** v.0.1

**Date:** 03.11.25

**Authors:** @sgunes16

---

## 1. Introduction

### 1.1 Purpose

This SRS document has been prepared to define the requirements of the Hive project and to ensure agreement on these requirements between the developer and the project owner before starting the design and implementation phases.

### 1.2 Scope

Hive is a non-profit project designed for a community where users can submit offers and wants. A website will be developed to enable users to perform these activities.

### 1.3 Definitions, Acronyms, and Abbreviations

- Hive: A community-oriented service offering platform
- User: A person who uses the Hive platform
- Offer: A service that a user is offering
- Want: A service that a user is wanting
- TimeBank: A system that allows users to exchange services where all contributions are valued equally in terms of time
- Admin: A user with access to manage users, offers, wants, and overall platform content and settings
- Handshake: A process where two users agree to exchange services
- Rating: A rating given by a user to another user
- Transaction: A record of a service exchange between two users
- Profile: A user's profile information
- TimeBankTransaction: A record of a time bank transaction
- Fuzzy Location: An approximate location shown for privacy, hiding exact coordinates
- Forum: A community discussion area for topics and conversations
- Forum Topic: A discussion thread on a specific subject

### 1.4 References

- [Django Documentation](https://docs.djangoproject.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Chakra UI Documentation](https://chakra-ui.com/docs)

### 1.5 Overview

Hive is a platform that allows users to share and request various services within a community, prioritizing collaboration and mutual support. The system enables users to see and interact with available offers and wants, making exchange straightforward.

The platform is centered around a TimeBank system, enabling users to exchange services where all contributions are valued equally in terms of time. Additionally, it offers basic administrative and community features to encourage participation, support, and interaction among members.

The platform will be accessible from any web browser and can be used on both desktop and mobile devices. The backend will operate on a cloud-based Linux server, and no additional software installation will be required for users.

The system will be built using Django and PostgreSQL.


---

## 2. Overall Description

### 2.1 Product Perspective

The product is required to be standalone. After project completion, product owners should be able to manage the project without needing any additional software.

### 2.2 Product Functions

Hive is a platform that allows users to share and request various services within a community, prioritizing collaboration and mutual support. The system enables users to see and interact with available offers and wants, making exchange straightforward.

The platform is centered around a TimeBank system, enabling users to exchange services where all contributions are valued equally in terms of time. Additionally, it offers basic administrative and community features to encourage participation, support, and interaction among members.

### 2.3 User Classes and Characteristics

| User Role       | Description                                                                                                                                                           | Technical Expertise                       | Typical Goals                                                                            |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|------------------------------------------------------------------------------------------|
| Anonymous User  | A visitor who has not registered or logged into the system. Can only browse public offers and wants.                                                                  | None                                      | Browse the platform, view public offers/wants                                            |
| Registered User | A user who has signed up and logged into the system. Can create, edit, and delete their own offers/wants, view others' offers/wants, and interact with the community. | Basic computer literacy                   | Add offers/wants, participate in exchanges, manage own profile                           |
| Admin           | A user with access to manage users, offers, wants, and overall platform content and settings. Can resolve disputes and moderate community participation.              | Intermediate to advanced technical skills | Moderate the community, manage users and content, ensure smooth operation and compliance |

### 2.4 Operating Environment

The platform will be accessible from any web browser and can be used on both desktop and mobile devices. The backend will operate on a cloud-based Linux server, and no additional software installation will be required for users.

### 2.5 Constraints

#### 2.5.1 Technical

- The backend will be built using Django and PostgreSQL.
- The application must support the latest two versions of major web browsers (Chrome, Firefox, Edge, Safari).
- All communications between client and server must use HTTPS.
- The system must be able to scale horizontally as user demand grows.
- Maximum file upload size will be limited to 10MB per file.
- Sensitive data (such as passwords) must be stored securely (encrypted or hashed, following best practices).

#### 2.5.2 Legal

- The platform must protect user privacy and follow laws like GDPR if needed.
- User information cannot be shared without their clear permission, unless the law says so.
- Users should be able to see, change, or delete their personal data if they ask.
- The system must show a simple privacy policy and ask users before collecting their information.

#### 2.5.3 Operational

- The system should have 99% or higher uptime, except during scheduled maintenance.
- Maintenance tasks like database backups and updates should be done during low-traffic times to avoid disturbing users.
- Admin actions like banning users, moderating content, or posting important announcements should be possible without needing to take the system offline.
- The platform should not depend on any service or tool that the project owners can't manage or replace after delivery.
- Regular backups of all data should be made and kept safe so that information can be restored if needed.
- There should be an easy way for users to report issues and get support when needed.


### 2.6 Assumptions and Dependencies

List assumptions that could affect the requirements.

- The system assumes users have access to an internet connection and a modern web browser.
- It is assumed that admins will be assigned and identifiable by a flag or role in the user model.
- User-generated content (such as offer descriptions, profile photos) is expected to comply with community guidelines; moderation will be the responsibility of platform admins.
- If integration with email or notification services is required, it is assumed that necessary credentials and configuration access will be available.
- Users are responsible for the accuracy of the data they enter; the system will provide validation and basic error checking.
- Any optional integrations with external services (e.g., social login) assume those services remain available and their terms of use do not conflict with project goals.

---

## 3. System Features and Requirements


### 3.1.1 Feature 1.1 – Create Offer

#### 3.1.1.1 Description

This feature allows registered users to create and publish offers. Users can add a title, description, tags, and optionally upload images. The system stores offers for retrieval, editing, and display on the public feed.

#### 3.1.1.2 User Story

> As a _registered user_, I want to _create a offer with a title, description, and tags_ so that _I can share my offer with other users on the platform_.

#### 3.1.1.3 Acceptance Criteria

- Given a registered user, when they submit a new offer with a title and description, then the offer is saved in the system and appears on the public feed.

- Given missing required fields (title or description), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own offers after creation.

- Offers shall include timestamps for creation and last modification.

- The system shall prevent unauthorized users from creating or editing offers.

#### 3.1.1.4 Functional Requirements

| ID   | Requirement                                                                                                    | Priority | Notes |
|------|----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-1 | A registered user shall be able to create a new offer with a title and description.                            | High     |       |
| FR-2 | A registered user shall be able to optionally add tags to an offer.                                            | Medium   |       |
| FR-3 | A registered user shall be able to upload images associated with the offer.                                    | Medium   |       |
| FR-4 | The system shall save offers and display them in the public feed.                                              | High     |       |
| FR-5 | Users shall only be able to edit or delete their own offers.                                                   | High     |       |
| FR-5a | A registered user shall be able to delete their own offer.                                                    | High     |       |
| FR-5b | The system shall require confirmation before deleting an offer.                                               | Medium   |       |
| FR-5c | The system shall prevent deletion of offers with PENDING, ACCEPTED, or COMPLETED exchanges (only CANCELLED or no exchanges allowed). | High     |       |
| FR-5d | Upon offer deletion, the system shall remove associated images and data.                                      | High     |       |
| FR-6 | The system shall validate that required fields are not empty before submission.                                | High     |       |
| FR-6a | The system shall prevent editing of offers with PENDING, ACCEPTED, or COMPLETED exchanges (only CANCELLED or no exchanges allowed). | High     |       |
| FR-6b | The system shall display edit lock status to the user when an offer cannot be edited.                         | Medium   |       |

#### 3.1.1.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Offers shall be saved and displayed in the feed within 2 seconds under normal load.                                    | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete offers.                                              | High      |
| Usability       | The create-offer form shall be responsive and accessible on desktop and mobile devices.                                | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.2 Feature 1.2 - Create Want

#### 3.1.2.1 Description

This feature allows registered users to create and publish wants. Users can add a title, description, tags, and optionally upload images. The system stores wants for retrieval, editing, and display on the public feed.

#### 3.1.2.2 User Story

> As a _registered user_, I want to _create a want with a title, description, and tags_ so that _I can share my want with other users on the platform_.

#### 3.1.2.3 Acceptance Criteria

- Given a registered user, when they submit a new want with a title and description, then the want is saved in the system and appears on the public feed.

- Given missing required fields (title or description), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own wants after creation.

- Wants shall include timestamps for creation and last modification.    

- The system shall prevent unauthorized users from creating or editing wants.

#### 3.1.2.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-7  | A registered user shall be able to create a new want with a title and description.                              | High     |       |
| FR-8  | A registered user shall be able to optionally add tags to a want.                                               | Medium   |       |
| FR-9  | A registered user shall be able to upload images associated with the want.                                      | Medium   |       |
| FR-10 | The system shall save wants and display them in the public feed.                                                | High     |       |
| FR-11 | Users shall only be able to edit or delete their own wants.                                                     | High     |       |
| FR-11a | A registered user shall be able to delete their own want.                                                      | High     |       |
| FR-11b | The system shall require confirmation before deleting a want.                                                  | Medium   |       |
| FR-11c | The system shall prevent deletion of wants with PENDING, ACCEPTED, or COMPLETED exchanges (only CANCELLED or no exchanges allowed). | High     |       |
| FR-11d | Upon want deletion, the system shall remove associated images and data.                                        | High     |       |
| FR-12 | The system shall validate that required fields are not empty before submission.                                 | High     |       |
| FR-12a | The system shall prevent editing of wants with PENDING, ACCEPTED, or COMPLETED exchanges (only CANCELLED or no exchanges allowed). | High     |       |
| FR-12b | The system shall display edit lock status to the user when a want cannot be edited.                            | Medium   |       |

#### 3.1.2.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Wants shall be saved and displayed in the feed within 2 seconds under normal load.                                     | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete wants.                                                | High      |
| Usability       | The create-want form shall be responsive and accessible on desktop and mobile devices.                                 | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.3 Feature 1.3 - View Offers and Wants

#### 3.1.3.1 Description

This feature allows users to view offers and wants. Users can view offers and wants in the public feed.

#### 3.1.3.2 User Story

> As a _user_, I want to _view offers and wants in the public feed_ so that _I can see what other users are offering and requesting_.

#### 3.1.3.3 Acceptance Criteria

- Given a user, when they view the public feed, then the offers and wants are displayed in the feed.

- Given no offers or wants are available, the system shall display a message indicating that there are no offers or wants to display.

- Users shall be able to search for offers and wants by title, description, tags, or location.

- Users shall be able to filter offers and wants by tags, location, or category.

- Users shall be able to sort offers and wants by creation date, title, or location.

- Users shall be able to view the details of an offer or want by clicking on it.

#### 3.1.3.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-13 | Both authenticated and anonymous users shall be able to view the public feed.                                                         | High     |       |
| FR-14 | A user shall be able to search for offers and wants by title, description, tags, or location.                                        | Medium   |       |
| FR-14a | The system shall support semantic search using tags to find related offers and wants.                                          | Medium   |       |
| FR-14b | The system shall index offer/want titles, descriptions, and tags for efficient search.                                               | Medium   |       |
| FR-15 | A user shall be able to filter offers and wants by tags, location, or category.                                                      | Medium   |       |
| FR-16 | A user shall be able to sort offers and wants by creation date, title, or location.                                                  | Medium   |       |
| FR-17 | Both authenticated and anonymous users shall be able to view the details of an offer or want by clicking on it.                      | High     |       |
| FR-17a | Anonymous users shall be redirected to login when attempting to interact with offers (request exchange, message, etc.).              | High     |       |

#### 3.1.3.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Offers and wants shall be displayed in the feed within 2 seconds under normal load.                                   | High      |
| Performance     | Search queries shall return results within 1 second for up to 10,000 offers/wants.                                    | High      |
| Security        | Anonymous users can view offers and wants but cannot interact (create, edit, request exchange).                       | High      |
| Usability       | The view-offers-wants page shall be responsive and accessible on desktop and mobile devices.                          | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.4 Feature 1.4 - User Onboarding

#### 3.1.4.1 Description

This feature allows users to onboard themselves to the platform. Users can create a profile, add a profile picture, and add a bio. The system stores the user's profile for retrieval, editing, and display on the public feed.

#### 3.1.4.2 User Story

> As a _user_, I want to _onboard myself to the platform_ so that _I can start using the platform_.

#### 3.1.4.3 Acceptance Criteria

- Given a user, when they onboard themselves to the platform, then the user's profile is saved in the system and appears on the public feed.

- Given missing required fields (name or email), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own profile after onboarding.

- Profiles shall include timestamps for creation and last modification.

- The system shall prevent unauthorized users from creating or editing profiles.

#### 3.1.4.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-18 | A user shall be able to create a new profile with a name and email.                                             | High     |       |
| FR-19 | A user shall be able to optionally add a profile picture to their profile.                                      | Medium   |       |
| FR-20 | A user shall be able to edit or delete their own profile after onboarding.                                      | High     |       |
| FR-21 | Profiles shall include timestamps for creation and last modification.                                           | High     |       |
| FR-22 | The system shall prevent unauthorized users from creating or editing profiles.                                  | High     |       |

#### 3.1.4.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Profiles shall be saved and displayed in the feed within 2 seconds under normal load.                                  | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete profiles.                                            | High      |
| Usability       | The onboarding form shall be responsive and accessible on desktop and mobile devices.                                  | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.5 Feature 1.5 - Transaction History

#### 3.1.6.1 Description

This feature allows users to view their transaction history. Users can view their transaction history and track their progress. The system stores the transaction history for retrieval, editing, and display on the public feed.

#### 3.1.6.2 User Story

> As a _user_, I want to _view my transaction history_ so that _I can track my progress_.

#### 3.1.6.3 Acceptance Criteria

- Given a user, when they view their transaction history, then the transaction history is displayed in the history.

- Given no transactions are available, the system shall display a message indicating that there are no transactions to display.

- Users shall be able to view the details of a transaction by clicking on it.

#### 3.1.6.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-27 | A user shall be able to view their transaction history.                                                         | High     |       |
| FR-28 | A user shall be able to view the details of a transaction by clicking on it.                                    | High     |       |
| FR-29 | A user shall be able to track their progress by clicking on the transaction history.                            | High     |       |

#### 3.1.6.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Transactions shall be displayed in the history within 2 seconds under normal load.                                     | High      |
| Security        | Only authenticated users shall be able to view their transaction history.                                              | High      |
| Usability       | The transaction history shall be responsive and accessible on desktop and mobile devices.                              | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.7 Feature 1.7 - Handshake and Rating – 5 Step Process

#### 3.1.7.1 Description

This feature allows users to initiate a handshake and rating process with another user. Users can initiate a handshake and rating process with another user and track the progress of the handshake and rating. The system stores the handshake and rating process for retrieval, editing, and display on the public feed.

#### 3.1.7.2 User Story

> As a _user_, I want to _initiate a handshake and rating process with another user_ so that _I can track the progress of the handshake and rating_.

#### 3.1.7.3 Acceptance Criteria

- Given a user, when they initiate a handshake and rating process with another user, then the handshake and rating process is displayed in the handshake and rating process.

- Users shall be able to chat with the other user during the handshake and rating process.

- Users shall be able to view the details of a handshake and rating process by clicking on it.

- Users shall be able to track the progress of the handshake and rating process by clicking on the handshake and rating process.

- The system shall prevent unauthorized users from initiating a handshake and rating process.

- The system shall validate that required fields are not empty before submission.

#### 3.1.7.4 Functional Requirements

| ID    | Requirement                                                                                                                              | Priority | Notes |
|-------|------------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-30 | A user shall be able to initiate a handshake and rating process with another user.                                                     | High     |       |
| FR-31 | A user shall be able to chat with the other user during the handshake and rating process.                                              | High     |       |
| FR-32 | A user shall be able to view the details of a handshake and rating process by clicking on it.                                          | High     |       |
| FR-33 | A user shall be able to track the progress of the handshake and rating process by clicking on the handshake and rating process.        | High     |       |
| FR-34 | The system shall display a message indicating that there are no handshake and rating processes to display.                             | High     |       |
| FR-35 | The system shall prevent unauthorized users from initiating a handshake and rating process.                                            | High     |       |
| FR-36 | The system shall validate that required fields are not empty before submission.                                                        | High     |       |
| FR-36a | A requester shall be able to cancel their PENDING or ACCEPTED exchange.                                                                | High     |       |
| FR-36b | The system shall return blocked time credits upon exchange cancellation.                                                               | High     |       |
| FR-36c | The system shall notify the provider when an exchange is cancelled by the requester.                                                   | High     |       |
| FR-36d | The system shall provide real-time updates for exchange status changes via WebSocket.                                                  | High     |       |
| FR-36e | A user shall be able to rate communication (1-5), punctuality (1-5), and recommendation after completing an exchange.                  | High     |       |
| FR-36f | A user shall be able to add a comment with their rating.                                                                               | Medium   |       |
| FR-36g | The system shall calculate and display average ratings on user profiles.                                                               | High     |       |
| FR-36h | A registered user shall be able to create a group offer with multiple participant slots (person_count).                                | High     |       |
| FR-36i | Group offers shall not require a proposed date for accepting exchanges.                                                                | Medium   |       |
| FR-36j | Each participant in a group offer shall have their own separate exchange.                                                              | High     |       |
| FR-36k | Each participant in a group offer shall confirm completion individually.                                                               | High     |       |
| FR-36l | The provider shall receive time credits only once when the first participant completes (subsequent completions burn credits).          | High     |       |
| FR-36m | For 1-to-1 offers, only one exchange can be ACCEPTED at a time.                                                                        | High     |       |
| FR-36n | For group offers, exchanges up to person_count can be ACCEPTED simultaneously.                                                         | High     |       |
| FR-36o | Offers shall be hidden from dashboard when all slots are filled (ACCEPTED or COMPLETED).                                              | High     |       |
| FR-36p | The system shall display slot availability status for group offers (e.g., "2/3 active, 1 done").                                       | Medium   |       |
| FR-36q | Group activity type shall only be available for offers, not for wants.                                                                 | Medium   |       |
| FR-36r | The requester shall not be able to cancel an exchange after the provider has confirmed completion.                                     | High     |       |
| FR-36s | A user shall be able to create one-time offers that are available for a single exchange.                                               | Medium   | NOT IMPLEMENTED |
| FR-36t | A user shall be able to create recurring offers that can be repeated on multiple dates.                                                | Medium   | NOT IMPLEMENTED |

#### 3.1.7.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Handshake and rating processes shall be displayed in the handshake and rating process within 2 seconds under normal load. | High      |
| Security        | Only authenticated users shall be able to initiate a handshake and rating process.                                      | High      |
| Usability       | The handshake and rating process shall be responsive and accessible on desktop and mobile devices.                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.8 Feature 1.8 - Time Bank

#### 3.1.8.1 Description

This feature allows users to view their time bank. Users can view their time bank and track their progress. The system stores the time bank for retrieval, editing, and display on the public feed.

#### 3.1.8.2 User Story

> As a _user_, I want to _view my time bank_ so that _I can track my progress_.

#### 3.1.8.3 Acceptance Criteria

- Given a user, when they view their time bank, then the time bank is displayed in the time bank.

- Given no time bank is available, the system shall display a message indicating that there are no time bank to display.

- Users shall be able to view the details of a time bank by clicking on it.

#### 3.1.8.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-37 | A user shall be able to view their time bank.                                                                   | High     |       |
| FR-38 | A user shall be able to view the details of a time bank by clicking on it.                                      | High     |       |
| FR-38a | The system shall block requester's time credits when an exchange is created.                                   | High     |       |
| FR-38b | The system shall display available and blocked amounts separately.                                             | High     |       |
| FR-38c | The system shall unblock credits upon exchange cancellation.                                                   | High     |       |
| FR-38d | The system shall transfer credits from requester to provider upon exchange completion.                         | High     |       |

#### 3.1.8.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Time bank shall be displayed in the time bank within 2 seconds under normal load.                                       | High      |
| Security        | Only authenticated users shall be able to view their time bank.                                                        | High      |
| Usability       | The time bank shall be responsive and accessible on desktop and mobile devices.                                        | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.9 Feature 1.9 - Map View and Location Privacy

#### 3.1.9.1 Description

This feature allows users to view offers and wants on an interactive map. Users can see nearby offers/wants, filter by distance radius, and discover services in their area. The system implements **fuzzy location** to protect user privacy by displaying approximate locations instead of exact coordinates. Exact locations are only revealed after an exchange is accepted.

#### 3.1.9.2 User Story

> As a _user_, I want to _view offers and wants on a map with approximate locations_ so that _I can find nearby services while protecting my privacy_.

#### 3.1.9.3 Acceptance Criteria

- Given a user, when they view the map, then offers/wants are displayed with markers at fuzzy/approximate locations.

- Users shall be able to filter offers/wants by distance radius (1km to 20km) from their current location.

- Remote/online offers shall always be visible regardless of distance filter.

- The exact coordinates shall be hidden until an exchange is accepted between users.

- Users shall see neighborhood-level location names instead of exact addresses on public views.

- Users shall be able to click on a marker to view offer/want details.

#### 3.1.9.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-39 | A user shall be able to list the map and see the offers/wants on the map.                                       | High     |       |
| FR-40 | A user shall be able to view the details of an offer/want by clicking on it on the map.                         | High     |       |
| FR-41 | A user shall be able to set a geo-location for their offer/want.                                                | High     |       |
| FR-41a | A user shall be able to filter offers/wants by distance radius (1-20km) from their location.                   | High     |       |
| FR-41b | A user shall be able to choose between remote (online) or in-person location type for offers/wants.            | High     |       |
| FR-41c | The system shall display nearby offers/wants count on the map.                                                 | Low      |       |
| FR-41d | The system shall display fuzzy/approximate locations for offers and wants on the public feed and map.          | High     | Privacy |
| FR-41e | The system shall offset exact coordinates by a random amount within a configurable radius (500m-1km).          | High     | Privacy |
| FR-41f | The system shall display neighborhood-level location names instead of exact addresses.                         | Medium   | Privacy |
| FR-41g | The system shall reveal exact location only after an exchange is accepted.                                     | High     | Privacy |
| FR-41h | Remote offers shall be excluded from location-based filtering but always visible.                              | High     |       |
| FR-41i | The system shall use a maximum 20km radius for backend location-based offer filtering.                         | Medium   |       |
| FR-41j | The system shall request user location permission and show warning if not granted.                             | Medium   |       |

#### 3.1.9.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Location filtering shall complete within 500ms for up to 1000 offers.                                                   | High      |
| Performance     | Map markers shall be displayed within 2 seconds under normal load.                                                      | High      |
| Security        | Exact user locations shall never be exposed in API responses to unauthorized users.                                     | High      |
| Privacy         | The fuzzy location algorithm shall prevent reverse-engineering of exact location from multiple queries.                 | High      |
| Usability       | The map shall be responsive and accessible on desktop and mobile devices.                                              | Medium    |
| Usability       | Users shall be clearly informed that their location is shown approximately.                                             | Medium    |

### 3.1.10 Feature 1.10 - User Profile

#### 3.1.10.1 Description

This feature allows users to view their profile. Users can view their profile and see their offers, wants, and time bank. The system stores the profile for retrieval, editing, and display on the public feed.

#### 3.1.10.2 User Story

> As a _user_, I want to _view my profile and see my offers, wants, and time bank_ so that _I can see what I can offer and what I can request_.

#### 3.1.10.3 Acceptance Criteria

- Given a user, when they view their profile, then the profile is displayed in the profile.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no time bank is available, the system shall display a message indicating that there are no time bank to display.

#### 3.1.10.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-42 | A user shall be able to view their profile and see their offers, wants, and time bank.                                               | High     |       |
| FR-43 | A user shall be able to view their offers by clicking on the offers.                                                                 | High     |       |
| FR-44 | A user shall be able to view their wants by clicking on the wants.                                                                   | High     |       |
| FR-45 | A user shall be able to view their time bank by clicking on the time bank.                                                           | High     |       |

#### 3.1.10.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Profile shall be displayed in the profile within 2 seconds under normal load.                                           | High      |
| Security        | Only authenticated users shall be able to view their profile and see their offers, wants, and time bank.               | High      |
| Usability       | The profile shall be responsive and accessible on desktop and mobile devices.                                          | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.11 Feature 1.11 - See Other Users' Profiles

#### 3.1.11.1 Description

This feature allows users to see other users' profiles. Users can see other users' profiles and see their offers, wants, ratings, and comments. The system stores the other users' profile for retrieval, editing, and display on the public feed.

#### 3.1.11.2 User Story

> As a _user_, I want to _see other users' profiles and see their offers, wants, ratings, and comments_ so that _I can see what they can offer and what they can request_.

#### 3.1.11.3 Acceptance Criteria

- Given a user, when they see other users' profiles, then the other users' profiles are displayed in the other users' profiles.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no ratings are available, the system shall display a message indicating that there are no ratings to display.

- Given no comments are available, the system shall display a message indicating that there are no comments to display.

#### 3.1.11.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-47 | A user shall be able to see other users' profiles and see their offers, wants, ratings, and comments.                                | High     |       |
| FR-48 | A user shall be able to view their offers by clicking on the offers.                                                                 | High     |       |
| FR-49 | A user shall be able to view their wants by clicking on the wants.                                                                   | High     |       |
| FR-50 | A user shall be able to view their ratings by clicking on the ratings.                                                               | High     |       |
| FR-51 | A user shall be able to view their comments by clicking on the comments.                                                             | High     |       |

#### 3.1.11.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Other users' profiles shall be displayed in the other users' profiles within 2 seconds under normal load.             | High      |
| Security        | Only authenticated users shall be able to see other users' profiles and see their offers, wants, ratings, and comments. | High      |
| Usability       | The other users' profiles shall be responsive and accessible on desktop and mobile devices.                            | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.12 Feature 1.12 - Admin Panel

#### 3.1.12.1 Description

This feature allows admins to view the admin panel. Admins can view the admin panel and see the users, offers, wants, ratings, and comments. The system stores the admin panel for retrieval, editing, and display on the public feed.

#### 3.1.12.2 User Story

> As an _admin_, I want to _view the admin panel and see the users, offers, wants, ratings, and comments_ so that _I can manage the platform_.

#### 3.1.12.3 Acceptance Criteria

- Given an admin, when they view the admin panel, then the admin panel is displayed in the admin panel.

- Given no users are available, the system shall display a message indicating that there are no users to display.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no ratings are available, the system shall display a message indicating that there are no ratings to display.

- Given no comments are available, the system shall display a message indicating that there are no comments to display.

#### 3.1.12.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-53 | An admin shall be able to view the admin panel and see the users, offers, wants, ratings, and comments.                              | High     |       |
| FR-54 | An admin shall be able to view the users by clicking on the users.                                                                   | High     |       |
| FR-55 | An admin shall be able to view the offers by clicking on the offers.                                                                 | High     |       |
| FR-56 | An admin shall be able to view the wants by clicking on the wants.                                                                   | High     |       |
| FR-57 | An admin shall be able to view the ratings by clicking on the ratings.                                                               | High     |       |
| FR-58 | An admin shall be able to view the comments by clicking on the comments.                                                             | High     |       |
| FR-59 | An admin shall be able to view the transactions by clicking on the transactions.                                                     | High     |       |
| FR-61 | An admin shall be able to view the time bank by clicking on the time bank.                                                           | High     |       |
| FR-62 | An admin shall be able to view the handshake and rating processes by clicking on the handshake and rating processes.                 | High     |       |
| FR-62a | An admin shall be able to view KPI dashboard with total users, exchanges, and pending reports count.                                | High     |       |
| FR-62b | An admin shall be able to issue warnings to users with a message.                                                                   | High     |       |
| FR-62c | An admin shall be able to ban users with a reason.                                                                                  | High     |       |
| FR-62d | The system shall track warning count for each user.                                                                                 | High     |       |
| FR-62e | Banned users shall not be able to log in to the platform.                                                                           | High     |       |
| FR-62f | An admin shall be able to delete offers or wants.                                                                                   | High     |       |
| FR-62g | An admin shall be able to cancel exchanges and return blocked credits.                                                              | High     |       |
| FR-62h | The system shall notify affected users when content is removed or action is taken.                                                  | Medium   |       |

#### 3.1.12.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Admin panel shall be displayed in the admin panel within 2 seconds under normal load.                                   | High      |
| Security        | Only authenticated admins shall be able to view the admin panel and see the users, offers, wants, ratings, and comments. | High      |
| Usability       | The admin panel shall be responsive and accessible on desktop and mobile devices.                                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.13 Feature 1.13 - Flag and Report User

#### 3.1.13.1 Description

This feature allows admins to flag and report users. Admins can flag and report users and see the flagged and reported users. The system stores the flagged and reported users for retrieval, editing, and display on the public feed.

#### 3.1.13.2 User Story

> As a _admin_, I want to _flag and report users_ so that _I can manage the platform_.

#### 3.1.13.3 Acceptance Criteria

- Given a admin, when they flag and report users, then the flagged and reported users are displayed in the flagged and reported users.

- Given no flagged and reported users are available, the system shall display a message indicating that there are no flagged and reported users to display.

- Users shall be able to view the details of a flagged and reported user by clicking on it.

#### 3.1.13.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-63 | A admin shall be able to flag and report users.                                                                 | High     |       |
| FR-64 | A admin shall be able to view the flagged and reported users by clicking on the flagged and reported users.    | High     |       |
| FR-65 | A admin shall be able to view the details of a flagged and reported user by clicking on it.                     | High     |       |

#### 3.1.13.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Flagged and reported users shall be displayed in the flagged and reported users within 2 seconds under normal load. | High      |
| Security        | Only authenticated admins shall be able to flag and report users.                                                     | High      |
| Usability       | The flagged and reported users shall be responsive and accessible on desktop and mobile devices.                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.14 Feature 1.14 - Authentication and Account Management

#### 3.1.14.1 Description

This feature allows users to login, register, manage their authentication credentials, and control their account. Users can login, register, change their password, logout, and permanently delete their account. The system provides secure authentication and account management functionality.

#### 3.1.14.2 User Story

> As a _user_, I want to _manage my account and authentication_ so that _I can securely access and control my account_.

#### 3.1.14.3 Acceptance Criteria

- Given a user, when they login with valid credentials, then they shall be authenticated and redirected to the dashboard.

- Given a user wants to change their password, then they shall provide current password and new password.

- Given a user wants to delete their account, then they shall confirm the action and all their data shall be removed.

- Users shall be able to logout from all devices.

#### 3.1.14.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-66 | A user shall be able to login to the platform with email and password.                                          | High     |       |
| FR-67 | A user shall be able to register to the platform with first name, last name, email, and password.               | High     |       |
| FR-68 | A user shall be able to logout from the platform.                                                               | High     |       |
| FR-69 | A registered user shall be able to change their password by providing current and new password.                 | High     |       |
| FR-69a | The system shall validate the current password before allowing password change.                                | High     |       |
| FR-69b | The system shall apply the same password validation rules to the new password.                                 | High     |       |
| FR-69c | A registered user shall be able to permanently delete their account.                                           | High     |       |
| FR-69d | The system shall require confirmation before deleting an account.                                              | High     |       |
| FR-69e | Upon account deletion, the system shall remove or anonymize all user data, offers, wants, and exchanges.       | High     | GDPR  |
| FR-69f | The system shall notify the user via email when their account is deleted.                                      | Medium   |       |
| FR-69g | A user shall be able to logout from all devices (invalidate all sessions).                                     | Medium   |       |

#### 3.1.14.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Authentication operations shall complete within 2 seconds under normal load.                                            | High      |
| Security        | Passwords shall be securely hashed and never stored in plain text.                                                      | High      |
| Security        | Account deletion shall be irreversible and complete within 30 days per GDPR requirements.                               | High      |
| Usability       | The authentication pages shall be responsive and accessible on desktop and mobile devices.                              | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.15 Feature 1.15 - Notification System

#### 3.1.15.1 Description

This feature allows users to receive and manage notifications. Users can view notifications, mark them as read/unread, and clear all notifications. The system sends notifications for important events like exchange requests, acceptances, completions, and admin actions.

#### 3.1.15.2 User Story

> As a _registered user_, I want to _receive notifications about my exchanges and platform activities_ so that _I can stay informed about important events_.

#### 3.1.15.3 Acceptance Criteria

- Given a user, when an important event occurs (exchange request, acceptance, completion), then the user receives a notification.

- Users shall be able to view all their notifications in a dedicated page.

- Users shall be able to mark individual notifications as read or unread.

- Users shall be able to mark all notifications as read at once.

- Unread notification count shall be displayed in the navigation bar.

#### 3.1.15.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-70 | The system shall send notifications to users when important events occur.                                       | High     |       |
| FR-71 | A user shall be able to view all their notifications.                                                           | High     |       |
| FR-72 | A user shall be able to mark individual notifications as read or unread.                                        | Medium   |       |
| FR-73 | A user shall be able to mark all notifications as read at once.                                                 | Medium   |       |
| FR-74 | The system shall display unread notification count in the navigation bar.                                       | High     |       |
| FR-75 | A user shall be able to filter notifications by read/unread status.                                             | Low      |       |

#### 3.1.15.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Notifications shall be delivered within 1 second of the triggering event.                                              | High      |
| Security        | Only the user to whom the notification belongs shall be able to view or manage it.                                     | High      |
| Usability       | The notification interface shall be intuitive and accessible on all devices.                                           | Medium    |

### 3.1.16 Feature 1.16 - User Report System

#### 3.1.16.1 Description

This feature allows registered users to report inappropriate content or behavior. Users can report offers, wants, exchanges, or other users with a reason and description. Admins can then review and act on these reports.

#### 3.1.16.2 User Story

> As a _registered user_, I want to _report inappropriate content or users_ so that _the platform remains safe and respectful_.

#### 3.1.16.3 Acceptance Criteria

- Given a user, when they encounter inappropriate content, then they can submit a report with a reason.

- Users shall be able to select a reason category (spam, inappropriate, harassment, fraud, etc.).

- Users shall be able to add an optional description to the report.

- The system shall prevent duplicate reports from the same user for the same target.

#### 3.1.16.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-76 | A user shall be able to report an offer, want, exchange, or another user.                                       | High     |       |
| FR-77 | A user shall be able to select a reason category for the report.                                                | High     |       |
| FR-78 | A user shall be able to add a description to the report.                                                        | Medium   |       |
| FR-79 | The system shall prevent duplicate reports from the same user for the same target.                              | Medium   |       |

#### 3.1.16.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Report submission shall complete within 2 seconds.                                                                     | High      |
| Security        | Reports shall only be viewable by admins and the reporting user.                                                       | High      |

### 3.1.17 Feature 1.17 - Password Validation and Email Verification

#### 3.1.17.1 Description

This feature enforces password security requirements during registration and requires users to verify their email address before accessing certain features. Strong password validation ensures account security, while email verification confirms user identity and prevents fake accounts.

#### 3.1.17.2 User Story

> As a _new user_, I want to _create a secure account with a strong password and verify my email_ so that _my account is protected and I can access all platform features_.

#### 3.1.17.3 Acceptance Criteria

- Given a user registering, when they enter a password, then the system shall validate it against security requirements.

- Given a weak password, the system shall display specific error messages indicating which requirements are not met.

- Given a successful registration, the system shall send a verification email to the user's email address.

- Given an unverified user, they shall be restricted from creating offers or exchanges until email verification is complete.

- Given a verification token, when the user clicks the link, then their email shall be verified and they gain full access.

#### 3.1.17.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-80 | The system shall validate that passwords are at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit.  | High     |       |
| FR-81 | The system shall send a verification email upon user registration.                                              | High     |       |
| FR-82 | Unverified users shall not be able to create offers or exchanges.                                               | High     |       |
| FR-83 | A user shall be able to request a new verification email.                                                       | Medium   |       |

#### 3.1.17.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Verification emails shall be sent within 5 seconds of registration.                                                    | High      |
| Security        | Verification tokens shall expire after 24 hours.                                                                       | High      |
| Usability       | Password requirements shall be displayed in real-time as the user types.                                               | Medium    |

### 3.1.18 Feature 1.18 - Community Forum

#### 3.1.18.1 Description

This feature provides a community forum where users can create discussion topics, ask questions, share experiences, and engage with other community members. The forum promotes community building, knowledge sharing, and helps users find services or offer advice beyond direct exchanges.

#### 3.1.18.2 User Story

> As a _registered user_, I want to _participate in community discussions_ so that _I can connect with other members, ask questions, and share my experiences_.

#### 3.1.18.3 Acceptance Criteria

- Given a registered user, when they access the forum, then they can view all discussion topics.

- Users shall be able to create new discussion topics with a title and content.

- Users shall be able to reply to existing topics.

- Users shall be able to like/upvote helpful posts.

- Users shall be able to search and filter forum topics by category or keyword.

- Forum posts shall display author information and timestamps.

- Admins shall be able to moderate forum content (pin, close, delete topics).

#### 3.1.18.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-84 | A registered user shall be able to view all forum topics.                                                       | High     |       |
| FR-85 | A registered user shall be able to create a new forum topic with title and content.                             | High     |       |
| FR-86 | A registered user shall be able to reply to forum topics.                                                       | High     |       |
| FR-87 | A registered user shall be able to like/upvote forum posts and replies.                                         | Medium   |       |
| FR-88 | A user shall be able to search forum topics by keyword.                                                         | Medium   |       |
| FR-89 | A user shall be able to filter forum topics by category (General, Help, Tips, Feedback, etc.).                  | Medium   |       |
| FR-90 | Forum posts shall display author name, avatar, and creation timestamp.                                          | High     |       |
| FR-91 | A registered user shall be able to edit or delete their own forum posts.                                        | Medium   |       |
| FR-92 | An admin shall be able to pin important topics to the top.                                                      | Low      |       |
| FR-93 | An admin shall be able to close topics to prevent further replies.                                              | Medium   |       |
| FR-94 | An admin shall be able to delete inappropriate forum posts or topics.                                           | High     |       |
| FR-95 | The system shall notify users when someone replies to their topic.                                              | Medium   |       |
| FR-96 | A user shall be able to follow topics to receive notifications on new replies.                                  | Low      |       |

#### 3.1.18.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Forum page shall load within 2 seconds with up to 100 topics displayed.                                                 | High      |
| Security        | Only authenticated users shall be able to create or reply to forum topics.                                              | High      |
| Usability       | The forum interface shall be intuitive with clear navigation and post formatting options.                               | Medium    |
| Scalability     | The forum shall support up to 10,000 topics and 100,000 replies without degradation.                                    | Medium    |
| Moderation      | The system shall provide tools for efficient content moderation and spam prevention.                                    | High      |

### 3.1.19 Feature 1.19 - Achievement Tree (Gamification)

#### 3.1.19.1 Description

This feature introduces a gamification system where users earn achievements (badges) based on their activity and contributions to the community. The achievement tree motivates users to engage more, complete exchanges, and build their reputation through visible progress indicators and unlockable milestones.

#### 3.1.19.2 User Story

> As a _registered user_, I want to _earn achievements and badges as I use the platform_ so that _I feel rewarded for my contributions and motivated to participate more_.

#### 3.1.19.3 Acceptance Criteria

- Given a user profile, the system shall display earned achievements/badges.

- When a user completes specific milestones (e.g., first exchange, 10 hours given), they shall automatically earn the corresponding achievement.

- Users shall be able to view their progress towards locked achievements.

- Achievements shall be categorized by type (Exchange, Community, Time, Special).

- The achievement tree shall be visually represented showing unlocked and locked badges.

- Other users shall be able to see achievements on a member's profile.

#### 3.1.19.4 Functional Requirements

| ID     | Requirement                                                                                                     | Priority | Notes |
|--------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-97  | The system shall track user activities and progress towards achievements.                                        | High     |       |
| FR-98  | A user shall automatically earn achievements when they meet the criteria.                                        | High     |       |
| FR-99  | A user shall be able to view their achievement tree showing earned and locked badges.                            | High     |       |
| FR-100 | A user shall be able to view progress percentage for locked achievements.                                        | Medium   |       |
| FR-101 | Achievements shall be displayed on user profiles, visible to other members.                                      | Medium   |       |
| FR-102 | The system shall send a notification when a user earns a new achievement.                                        | Medium   |       |
| FR-103 | Achievements shall be categorized: Exchange (first exchange, 5 exchanges, etc.), Time (10h given, 50h given), Community (first forum post, helpful replies), Special (early adopter, verified profile). | High     |       |
| FR-104 | An admin shall be able to create and manage achievement definitions.                                             | Low      |       |
| FR-105 | A user shall be able to showcase selected achievements as "featured" on their profile.                           | Low      |       |

#### 3.1.19.5 Achievement Examples

| Achievement Name     | Category   | Criteria                                      | Badge Icon |
|---------------------|------------|-----------------------------------------------|------------|
| First Buzz          | Exchange   | Complete your first exchange                  | 🐝         |
| Busy Bee            | Exchange   | Complete 5 exchanges                          | 🐝🐝       |
| Hive Hero           | Exchange   | Complete 25 exchanges                         | 🏆         |
| Time Giver          | Time       | Give 10 hours of service                      | ⏰         |
| Time Master         | Time       | Give 50 hours of service                      | ⏰⏰       |
| Community Voice     | Community  | Create first forum topic                      | 💬         |
| Helping Hand        | Community  | Receive 10 positive ratings                   | 👍         |
| Verified Member     | Special    | Complete email verification                   | ✅         |
| Profile Pro         | Special    | Complete profile with bio, skills, and photo  | 📋         |
| Early Adopter       | Special    | Joined during beta period                     | 🌟         |

#### 3.1.19.6 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Achievement checks shall not add more than 100ms to any API response.                                                   | High      |
| Usability       | Achievement progress and unlocks shall be clearly visualized with animations.                                           | Medium    |
| Scalability     | The system shall support up to 100 different achievement types.                                                         | Medium    |
| Engagement      | Achievements shall be designed to encourage positive platform behaviors.                                                 | High      |

---

## 4. Nonfunctional Requirements

### 4.1 Performance Requirements

- The system shall respond to user actions within 2 seconds under normal load.
- The system shall handle at least 50 requests per second.
- The system shall be able to scale to support more users as needed.

### 4.2 Security Requirements

- All sensitive user data shall be encrypted in transit and at rest.
- Passwords shall be securely hashed.
- Access to data and actions shall be restricted by user roles.
- Only authorized users shall access admin functionality.
- The system shall validate inputs to prevent security vulnerabilities.
- Security events shall be logged, and audit logs shall be available to admins.
- The system shall comply with data protection laws and shall support user data deletion.

### 4.3 Usability Requirements

- The interface shall be simple and easy to use.
- Key actions (login, registration, creating/searching offers) shall be completed in no more than 3 steps.
- The user interface shall be responsive and work on both desktop and mobile devices.

### 4.4 Reliability and Availability

- The system shall be available 99.9% of the time, with scheduled maintenance periods of no more than 1 hour per month.
- The system shall be able to recover from failures and continue operating without data loss.
- The system shall be able to handle at least 100 concurrent users without significant performance degradation.
- The system shall be able to handle at least 1000 requests per second without significant performance degradation.

### 4.5 Portability

- The system shall be able to run on any Linux-based server.
- The website shall be accessible from any web browser.

### 4.6 Scalability

- The system shall be able to scale to support more users as needed.
- The system shall be able to scale to support more requests per second as needed.
- The system shall be able to scale to support more concurrent users as needed.
- The system shall be able to scale to support more data as needed.
- The system shall be able to scale to support more storage as needed.

---

## 5. System Models (Optional)

- **Use Case Diagram**

- **User Flow / Wireframe**

- **Sequence or Activity Diagrams**

- **Data Model (ER or Class Diagram)**

---

## 6. Glossary (Optional)

- **Offer** - An offer to provide a service.
- **Want** - A want to request a service.
- **Exchange** - An exchange of a service between two users.
- **Handshake** - A handshake (exchange process) between two users.
- **TimeBank** - A time bank for the system where users store time credits.
- **TimeBankTransaction** - A time bank transaction record.
- **Notification** - A message sent to a user about platform events.
- **Report** - A user-submitted complaint about content or behavior.
- **Rating** - Feedback given after completing an exchange.
- **WebSocket** - A real-time communication protocol for instant updates.
- **Blocked Credits** - Time credits reserved for pending exchanges.
- **Available Credits** - Time credits available for new exchanges.
- **KPI** - Key Performance Indicator, metrics for monitoring platform health.
- **Geo-location** - Geographic coordinates (latitude/longitude) of a location.
- **Provider** - The user who offers/provides a service in an exchange.
- **Requester** - The user who requests/receives a service in an exchange.
- **Group Offer** - An offer that allows multiple participants (slots) to join simultaneously.
- **Slot** - A participant position in a group offer; each slot corresponds to one exchange.
- **One-time Offer** - An offer that is available for a single exchange only (NOT IMPLEMENTED).
- **Recurring Offer** - An offer that can be repeated multiple times on different dates (NOT IMPLEMENTED).
- **Credit Burning** - When time credits are deducted from a requester but not transferred to the provider (in group offers after first completion).
- **Fuzzy Location** - An approximate/obfuscated location displayed to protect user privacy, hiding exact coordinates while showing general area.
- **Forum** - A community discussion platform where users can create topics, reply, and engage with other members.
- **Forum Topic** - A discussion thread initiated by a user on a specific subject.
- **Forum Reply** - A response to an existing forum topic.
- **Pinned Topic** - A forum topic fixed at the top of the list by admins for visibility.
- **Closed Topic** - A forum topic that no longer accepts new replies.
- **Achievement** - A badge or milestone earned by completing specific actions on the platform (e.g., first exchange, 10 hours given).
- **Achievement Tree** - A visual representation of all available achievements, showing progress and unlocked badges.
- **Badge** - A visual icon representing an earned achievement, displayed on user profiles.

---

## 7. Appendices

- Prototype or mockup links

- References to Agile artifacts (e.g., Product Backlog, Sprint Backlog)
