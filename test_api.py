import requests
import urllib3
urllib3.disable_warnings()

IP = "72.60.69.111"
AUTH = ("ck_01c58d4774ed8639b0cf588e3a8041eb05651364", "cs_5b8d73c452437cd802a7044c2f662815b1ee9275")

endpoints = [
    f"http://{IP}/wp-json/wc/v3/products",
    f"http://{IP}/index.php?rest_route=/wc/v3/products",
    f"https://{IP}/wp-json/wc/v3/products",
    f"https://{IP}/index.php?rest_route=/wc/v3/products"
]

for url in endpoints:
    try:
        print(f"Testing {url}...")
        r = requests.get(url, auth=AUTH, verify=False, timeout=5)
        print(f"Result: {r.status_code}")
        if r.status_code == 200:
            print("✅ FOUND WORKING ENDPOINT!")
            break
    except Exception as e:
        print(f"Error: {e}")
