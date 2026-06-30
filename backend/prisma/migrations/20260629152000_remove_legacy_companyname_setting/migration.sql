-- Remove legacy duplicate setting key. `crm_name` is the canonical CRM name key.

DELETE FROM "Setting"
WHERE "key" = 'companyName';
