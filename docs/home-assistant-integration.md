# Home Assistant Integration

This document describes how to connect Home Assistant (HA) to the baby tracker app so a physical button can start/stop baby sleep in the app and database.

## Architecture

```
Physical Button → Home Assistant → REST command → baby-tracker API → SQLite database
```

The baby-tracker app exposes a single REST endpoint:

- `POST http://<host>:3000/api/events` with body `{"type":"SLEEP"}`

The API toggles sleep automatically:

- No active sleep → creates a new SLEEP event
- Active sleep exists → closes it by setting `endTime`

## 1. Confirm the API is reachable

From the server/host terminal:

```bash
curl -v http://localhost:3000/api/events
```

If your container does not listen on `localhost`, use the container IP or host LAN IP instead:

```bash
curl -v http://<container-ip>:3000/api/events
```

## 2. Configure the REST command

In Home Assistant `configuration.yaml`:

```yaml
rest_command:
  baby_sleep_toggle:
    url: "http://<container-ip>:3000/api/events"
    method: "POST"
    headers:
      Content-Type: "application/json"
    payload: '{"type":"SLEEP"}'
    verify_ssl: false
```

Replace `<container-ip>` with the IP of the machine/container running the baby-tracker app.

Reload Home Assistant, then test in **Developer Tools → Services**:

```text
rest_command.baby_sleep_toggle
```

## 3. Create the automation

In **Settings → Automations → Create Automation**:

- **Trigger**: Device → your button → Press
- **Action**: Call Service → `rest_command.baby_sleep_toggle`

Optional: add a notification so you know the button worked.

## 4. Add a status sensor

To show `Sleeping` / `Awake` in the HA UI instead of `True` / `False`:

```yaml
sensor:
  - platform: rest
    name: "Baby Sleep Status"
    resource: "http://<container-ip>:3000/api/events"
    method: "GET"
    value_template: >-
      {% if value_json.isSleeping %}Sleeping{% else %}Awake{% endif %}
    json_attributes:
      - "sleepStartTime"
      - "lastSleepEnd"
    scan_interval: 60
```

The sensor state will now display friendly text:

| Baby state | HA sensor state |
|---|---|
| Sleeping | Sleeping |
| Awake | Awake |

## 5. Security (optional)

If the API is reachable outside your LAN, add a shared token:

1. Add to `.env.local`:

   ```bash
   BABY_API_TOKEN="your-secret-token"
   ```

2. In `app/api/events/route.ts`, at the top of `POST` and `GET`:

   ```ts
   const auth = request.headers.get('x-baby-token');
   if (auth !== process.env.BABY_API_TOKEN) {
     return new NextResponse("Unauthorized", { status: 401 });
   }
   ```

3. Add the header to the REST command:

   ```yaml
   headers:
     Content-Type: "application/json"
     X-Baby-Token: "your-secret-token"
   ```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Could not resolve host` | Use the container IP or fix DNS |
| `Connection refused` | Check the container port mapping (`3000:3000`) |
| `404 Not Found` | Verify the `/api/events` path |
| `401 Unauthorized` | Token is missing or incorrect |
| Button works in HA but not in app | Check the app's database write permissions |

## Notes

- The toggle is idempotent: pressing the button always switches the state.
- The REST sensor should be polled at least every 60 seconds to keep the HA UI in sync.
- The physical button can be any HA-supported device: Zigbee, Z-Wave, ESPHome, or a Home Assistant companion app button.
