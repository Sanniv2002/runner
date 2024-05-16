-- Use this file to test the script
-- To run this script in bash run 'redis-cli --eval script.lua'

-- script.lua
-- Function to process and empty a single queue key
local function process_queue(key)
    local len = redis.call('LLEN', key)
    local result = nil

    if len > 1 then
        result = redis.call('LPOP', key)
    elseif len == 1 then
        result = redis.call('RPOP', key)
    end

    -- Empty the queue
    while redis.call('LLEN', key) > 0 do
        redis.call('RPOP', key)
    end

    return result
end

-- Retrieve all keys matching the pattern for queues
local keys = redis.call('KEYS', '*')

-- Table to store results
local results = {}

-- Loop over each key and process the queue
for i, key in ipairs(keys) do
    local result = process_queue(key)
    if result then
        results[#results + 1] = {key, result}
    end
end

return results