//This is the lua script that will run during the redis transaction

export const script = `
local len = redis.call('LLEN', KEYS[1])
if len > 1 then
  local element = redis.call('RPOP', KEYS[1])
  redis.call('DEL', KEYS[1])
  return element
elseif len == 1 then
  return redis.call('RPOP', KEYS[1])
end
return nil
`;