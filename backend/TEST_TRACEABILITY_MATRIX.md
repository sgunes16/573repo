# Test Traceability Matrix

## Overview

| Metric | Value |
|--------|-------|
| **Total FRs in SRS** | 83 |
| **FRs with Tests** | 62 |
| **Coverage** | **75%** |
| **Total Test Cases** | 228 |

---

## Feature 1.1 - Create Offer (FR-1 to FR-6b)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-1 | Create offer with title/description | High | `test_offer_views.py` | `test_create_offer_success` | ✅ |
| FR-2 | Add tags to offer | Medium | `test_offer_views.py` | `test_create_offer_with_tags` | ✅ |
| FR-3 | Upload images to offer | Medium | `test_offer_views.py` | `test_upload_image_requires_authentication` | ⚠️ Partial |
| FR-4 | Display offers in feed | High | `test_offer_views.py` | `test_get_offers_success` | ✅ |
| FR-5 | Edit/delete own offers only | High | `test_offer_views.py` | `test_update_own_offer`, `test_update_others_offer_fails` | ✅ |
| FR-6 | Validate required fields | High | - | - | ❌ |
| FR-6a | Prevent edit with active exchanges | High | - | - | ❌ |
| FR-6b | Display edit lock status | Medium | - | - | ❌ |

## Feature 1.2 - Create Want (FR-7 to FR-12b)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-7 | Create want with title/description | High | `test_offer_views.py` | `test_create_want_success` | ✅ |
| FR-8 | Add tags to want | Medium | - | Covered by FR-2 | ⚠️ Implicit |
| FR-9 | Upload images to want | Medium | - | Covered by FR-3 | ⚠️ Implicit |
| FR-10 | Display wants in feed | High | `test_offer_views.py` | `test_get_offers_only_active` | ✅ |
| FR-11 | Edit/delete own wants only | High | - | Covered by FR-5 | ⚠️ Implicit |
| FR-12 | Validate required fields | High | - | - | ❌ |
| FR-12a | Prevent edit with active exchanges | High | - | - | ❌ |
| FR-12b | Display edit lock status | Medium | - | - | ❌ |

## Feature 1.3 - View Offers and Wants (FR-13 to FR-17)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-13 | View public feed | High | `test_offer_views.py` | `test_get_offers_success` | ✅ |
| FR-14 | Search by title/description/tags | Medium | - | - | ❌ |
| FR-15 | Filter by tags/location/category | Medium | - | - | ❌ |
| FR-16 | Sort by date/title/location | Medium | - | - | ❌ |
| FR-17 | View offer/want details | High | `test_offer_views.py` | `test_get_offer_detail_success` | ✅ |

## Feature 1.4 - User Onboarding / Profile (FR-18 to FR-22)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-18 | Create profile with name/email | High | `test_profile_views.py` | `test_get_own_profile_creates_defaults` | ✅ |
| FR-19 | Add profile picture | Medium | - | - | ❌ |
| FR-20 | Edit/delete profile | High | `test_profile_views.py` | `test_update_profile_bio`, `test_update_profile_location`, `test_update_profile_skills`, `test_update_profile_phone_number`, `test_update_user_names`, `test_update_profile_multiple_fields` | ✅ |
| FR-21 | Profile timestamps | High | `test_models.py` | Model default values | ⚠️ Implicit |
| FR-22 | Prevent unauthorized profile edit | High | `test_profile_views.py` | `test_get_profile_requires_authentication`, `test_update_profile_requires_authentication` | ✅ |

## Feature 1.5 - Transaction History (FR-27 to FR-29)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-27 | View transaction history | High | `test_timebank_flow.py` | `test_get_user_transactions` | ✅ |
| FR-28 | View transaction details | High | - | - | ❌ |
| FR-29 | Track progress | High | - | - | ❌ |

## Feature 1.7 - Handshake/Exchange (FR-30 to FR-36r)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-30 | Initiate exchange | High | `test_exchange_views.py` | `test_create_exchange_success` | ✅ |
| FR-31 | Chat during exchange | High | `test_consumers.py` | `test_connect_with_valid_token` | ⚠️ Partial |
| FR-32 | View exchange details | High | `test_exchange_views.py` | `test_get_exchange_detail` | ✅ |
| FR-33 | Track exchange progress | High | `test_exchange_views.py` | `test_get_my_exchanges` | ✅ |
| FR-34 | No exchanges message | High | - | - | ❌ |
| FR-35 | Prevent unauthorized exchange | High | `test_exchange_views.py` | `test_accept_exchange_non_provider_fails` | ✅ |
| FR-36 | Validate required fields | High | `test_exchange_views.py` | `test_propose_datetime_requires_date` | ✅ |
| FR-36a | Requester cancel exchange | High | `test_exchange_views.py` | `test_cancel_exchange_success` | ✅ |
| FR-36b | Return blocked credits on cancel | High | `test_exchange_flow.py` | `test_requester_cancels_pending_exchange` | ✅ |
| FR-36c | Notify provider on cancel | High | - | Mocked in tests | ⚠️ Partial |
| FR-36d | Real-time WebSocket updates | High | `test_consumers.py` | Basic connection tests | ⚠️ Partial |
| FR-36e | Rate communication/punctuality | High | `test_exchange_views.py` | `test_submit_rating_success` | ✅ |
| FR-36f | Add comment with rating | Medium | `test_exchange_views.py` | Included in rating tests | ✅ |
| FR-36g | Display average ratings | High | - | - | ❌ |
| FR-36h | Create group offer | High | `test_offer_views.py` | `test_create_group_offer_success` | ✅ |
| FR-36i | Group offers no date required | Medium | - | - | ❌ |
| FR-36j | Separate exchange per participant | High | `test_exchange_flow.py` | `test_group_offer_multiple_participants` | ✅ |
| FR-36k | Individual confirmation | High | `test_exchange_views.py` | `test_both_confirm_completes_exchange` | ✅ |
| FR-36l | Provider paid once (credit burn) | High | - | - | ❌ |
| FR-36m | 1-to-1 single active exchange | High | `test_exchange_views.py` | `test_create_exchange_duplicate_fails` | ✅ |
| FR-36n | Group slots up to person_count | High | - | - | ❌ |
| FR-36o | Hide filled offers from dashboard | High | Views logic implemented | ⚠️ No test |
| FR-36p | Display slot availability | Medium | - | - | ❌ |
| FR-36q | Group only for offers | Medium | - | - | ❌ |
| FR-36r | No cancel after provider confirm | High | `test_exchange_views.py` | `test_cancel_with_provider_confirmed_fails` | ✅ |

## Feature 1.8 - Time Bank (FR-37 to FR-38d)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-37 | View time bank | High | `test_models.py` | TimeBank model tests | ✅ |
| FR-38 | View time bank details | High | - | - | ❌ |
| FR-38a | Block credits on exchange create | High | `test_exchange_views.py` | `test_create_exchange_blocks_requester_credits` | ✅ |
| FR-38b | Display available/blocked amounts | High | `test_models.py` | `test_timebank_initial_values` | ✅ |
| FR-38c | Unblock credits on cancel | High | `test_timebank_flow.py` | `test_credit_unblocking_on_cancellation` | ✅ |
| FR-38d | Transfer credits on completion | High | `test_timebank_flow.py` | `test_credit_transfer_on_completion` | ✅ |

## Feature 1.9 - Map View (FR-39 to FR-41c)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-39 | View offers on map | High | - | - | ❌ |
| FR-40 | Click to view offer details | High | - | - | ❌ |
| FR-41 | Set geo-location | High | `test_offer_views.py` | - | ❌ |
| FR-41a | Filter by distance radius | Medium | - | - | ❌ |
| FR-41b | Remote/in-person location type | High | - | - | ❌ |
| FR-41c | Display nearby count | Low | - | - | ❌ |

## Feature 1.10 - User Profile (FR-42 to FR-45)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-42 | View profile with offers/wants/timebank | High | `test_profile_views.py` | `test_get_own_profile_success` | ✅ |
| FR-43 | View own offers | High | `test_profile_views.py` | Included in profile tests | ✅ |
| FR-44 | View own wants | High | `test_profile_views.py` | Included in profile tests | ✅ |
| FR-45 | View own time bank | High | `test_profile_views.py` | `test_get_own_profile_success` checks timebank | ✅ |

## Feature 1.11 - Other Users' Profiles (FR-47 to FR-51)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-47 | View other users' profiles | High | `test_profile_views.py` | `test_get_other_user_profile` | ✅ |
| FR-48 | View their offers | High | `test_profile_views.py` | `test_get_other_user_offers` | ✅ |
| FR-49 | View their wants | High | `test_profile_views.py` | `test_get_other_user_wants` | ✅ |
| FR-50 | View their ratings | High | `test_profile_views.py` | `test_get_other_user_ratings` | ✅ |
| FR-51 | View their comments | High | `test_profile_views.py` | `test_get_other_user_with_comments` | ✅ |

## Feature 1.12 - Admin Panel (FR-53 to FR-62h)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-53 | View admin panel | High | `test_admin_views.py` | `test_get_kpi_success` | ✅ |
| FR-54 | View users | High | - | - | ❌ |
| FR-55 | View offers | High | - | - | ❌ |
| FR-56 | View wants | High | - | - | ❌ |
| FR-57 | View ratings | High | - | - | ❌ |
| FR-58 | View comments | High | - | - | ❌ |
| FR-59 | View transactions | High | - | - | ❌ |
| FR-61 | View time bank | High | - | - | ❌ |
| FR-62 | View handshakes | High | `test_admin_views.py` | `test_get_exchange_detail_success`, `test_get_exchange_with_messages` | ✅ |
| FR-62a | View KPI dashboard | High | `test_admin_views.py` | `test_get_kpi_success`, `test_get_kpi_counts_correctly`, `test_get_kpi_includes_recent_reports` | ✅ |
| FR-62b | Issue warnings to users | High | `test_admin_views.py` | `test_warn_user_success`, `test_warn_user_increments_count` | ✅ |
| FR-62c | Ban users | High | `test_admin_views.py` | `test_ban_user_success`, `test_ban_user_with_duration` | ✅ |
| FR-62d | Track warning count | High | `test_admin_views.py` | `test_warn_user_increments_count` | ✅ |
| FR-62e | Banned users cannot login | High | - | - | ❌ |
| FR-62f | Admin delete offers/wants | High | `test_admin_views.py` | `test_delete_offer_success`, `test_delete_want_success` | ✅ |
| FR-62g | Admin cancel exchanges | High | - | - | ❌ |
| FR-62h | Notify affected users | Medium | `test_admin_views.py` | `test_warn_user_creates_notification` | ✅ |

## Feature 1.13 - Flag/Report User (FR-63 to FR-65)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-63 | Flag and report users | High | `test_admin_views.py` | `test_list_reports_success` | ✅ |
| FR-64 | View flagged/reported users | High | `test_admin_views.py` | `test_list_reports_success`, `test_list_reports_includes_details` | ✅ |
| FR-65 | View report details | High | `test_admin_views.py` | `test_list_reports_includes_details` | ✅ |

## Feature 1.14 - Login/Registration (FR-66 to FR-69)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-66 | User login | High | `auth/tests.py` | `LoginViewTests` | ✅ |
| FR-67 | User registration | High | `test_auth_views.py` | `test_register_valid_password_succeeds`, `test_register_with_first_last_name` | ✅ |
| FR-68 | View login page | High | - | Frontend | ⚠️ |
| FR-69 | View registration page | High | - | Frontend | ⚠️ |

## Feature 1.17 - Password & Email Verification (FR-80 to FR-83)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-80 | Password validation (8 chars, upper, lower, digit) | High | `test_auth_views.py` | `TestPasswordValidation::*`, `TestRegisterWithPasswordValidation::*` | ✅ |
| FR-81 | Send verification email on registration | High | `test_auth_views.py` | `test_register_creates_verification_token`, `test_verify_email_success` | ✅ |
| FR-82 | Unverified users cannot create offers/exchanges | High | `test_auth_views.py` | `test_unverified_user_cannot_create_offer`, `test_unverified_user_cannot_create_exchange`, `test_verified_user_can_create_offer` | ✅ |
| FR-83 | Resend verification email | Medium | `test_auth_views.py` | `test_resend_verification_success`, `test_resend_verification_invalidates_old_tokens` | ✅ |

## Feature 1.15 - Notification System (FR-70 to FR-75)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-70 | Send notifications on events | High | `test_notification_views.py` | `test_notification_created_on_event` | ✅ |
| FR-71 | View all notifications | High | `test_notification_views.py` | `test_get_notifications_success`, `test_notifications_includes_required_fields` | ✅ |
| FR-72 | Mark as read/unread | Medium | `test_notification_views.py` | `test_mark_notification_as_read`, `test_mark_notification_as_unread` | ✅ |
| FR-73 | Mark all as read | Medium | `test_notification_views.py` | `test_mark_all_as_read` | ✅ |
| FR-74 | Display unread count | High | `test_notification_views.py` | `test_notification_count_in_navbar` | ✅ |
| FR-75 | Filter by read/unread | Low | `test_notification_views.py` | `test_filter_notifications_by_read_status`, `test_filter_notifications_read_only` | ✅ |

## Feature 1.16 - User Report System (FR-76 to FR-79)

| FR ID | Requirement | Priority | Test File | Test Coverage | Status |
|-------|-------------|----------|-----------|---------------|--------|
| FR-76 | Report offer/want/exchange/user | High | `test_report_views.py` | `test_report_user_success`, `test_report_offer_success`, `test_report_want_success`, `test_report_exchange_success` | ✅ |
| FR-77 | Select reason category | High | `test_report_views.py` | `test_report_reason_spam`, `test_report_reason_inappropriate`, `test_report_reason_harassment`, `test_report_reason_fraud`, `test_report_reason_fake_profile`, `test_report_reason_other` | ✅ |
| FR-78 | Add description to report | Medium | `test_report_views.py` | `test_report_with_description` | ✅ |
| FR-79 | Prevent duplicate reports | Medium | `test_report_views.py` | `test_report_duplicate_prevented` | ✅ |

---

## Coverage Summary by Feature

| Feature | Total FRs | Covered | Coverage |
|---------|-----------|---------|----------|
| 1.1 Create Offer | 8 | 5 | 63% |
| 1.2 Create Want | 8 | 3 | 38% |
| 1.3 View Offers/Wants | 5 | 3 | 60% |
| 1.4 User Onboarding | 5 | 4 | **80%** ⬆️ |
| 1.5 Transaction History | 3 | 1 | 33% |
| 1.7 Handshake/Exchange | 23 | 15 | 65% |
| 1.8 Time Bank | 6 | 5 | 83% |
| 1.9 Map View | 6 | 0 | 0% |
| 1.10 User Profile | 4 | 4 | **100%** ⬆️ |
| 1.11 Other Profiles | 5 | 5 | **100%** ⬆️ |
| 1.12 Admin Panel | 16 | 9 | **56%** ⬆️ |
| 1.13 Flag/Report | 3 | 3 | **100%** ⬆️ |
| 1.14 Login/Registration | 4 | 2 | 50% |
| 1.15 Notifications | 6 | 6 | **100%** ⬆️ |
| 1.16 User Reports | 4 | 4 | **100%** ⬆️ |
| 1.17 Password & Email Verification | 4 | 4 | **100%** ✨ NEW |

---

## Priority Coverage

| Priority | Total FRs | Covered | Coverage |
|----------|-----------|---------|----------|
| **High** | 71 | 53 | **75%** ⬆️ |
| **Medium** | 12 | 9 | **75%** ⬆️ |
| **Low** | 2 | 1 | **50%** |

---

## Test Files Summary

| Test File | Test Count | Features Covered |
|-----------|------------|------------------|
| `test_models.py` | 42 | User, TimeBank, Offer, Exchange |
| `test_views/test_offer_views.py` | 20 | FR-1 to FR-17 |
| `test_views/test_exchange_views.py` | 38 | FR-30 to FR-36r |
| `test_views/test_profile_views.py` | 18 | FR-18 to FR-22, FR-42 to FR-51 |
| `test_views/test_admin_views.py` | 25 | FR-53 to FR-65 |
| `test_views/test_report_views.py` | 20 | FR-76 to FR-79 |
| `test_views/test_notification_views.py` | 17 | FR-70 to FR-75 |
| `test_views/test_auth_views.py` | 27 | FR-80 to FR-83 (Password & Email Verification) |
| `test_utils.py` | 23 | Utility functions |
| `test_consumers.py` | 11 | WebSocket tests |
| `integration/test_exchange_flow.py` | 11 | Exchange flow tests |
| `integration/test_timebank_flow.py` | 13 | TimeBank flow tests |

---

## Recommendations

### Still Missing Tests For:
1. **Map View** (FR-39 to FR-41c) - 0% coverage
2. **Search/Filter/Sort** (FR-14-16)
3. **Validation** (FR-6, FR-12)
4. **Edit Lock Status** (FR-6a, FR-6b, FR-12a, FR-12b)
5. **Banned User Login Prevention** (FR-62e)

### Test Files Still Needed:
- `tests/test_views/test_map_views.py` (if map API exists)

---

## Running Tests

```bash
# All tests
pytest

# Specific feature
pytest tests/test_views/test_profile_views.py -v

# With coverage
pytest --cov=rest_api --cov-report=html
```
