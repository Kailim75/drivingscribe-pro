ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS webhook_api_key text DEFAULT NULL;

-- Generate a default API key for organizations that already have a webhook_url set
UPDATE public.organizations 
SET webhook_api_key = encode(gen_random_bytes(24), 'hex')
WHERE webhook_url IS NOT NULL AND webhook_api_key IS NULL;