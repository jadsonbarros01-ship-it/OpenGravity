import os
import requests
import time
from bs4 import BeautifulSoup
from decimal import Decimal, ROUND_CEILING
from dotenv import load_dotenv
import urllib3

urllib3.disable_warnings()

load_dotenv()

class LifecycleAgent:
    def __init__(self):
        self.url = os.getenv("WOO_SHOP_URL")
        self.key = os.getenv("WOO_CONSUMER_KEY")
        self.secret = os.getenv("WOO_CONSUMER_SECRET")

    def get_products(self, per_page=100, page=1):
        """Fetch products from WooCommerce."""
        # Using query parameters for auth is more robust in Docker/Proxy setups
        endpoint = f"{self.url}/wp-json/wc/v3/products"
        params = {
            "consumer_key": self.key,
            "consumer_secret": self.secret,
            "per_page": per_page, 
            "page": page
        }
        response = requests.get(endpoint, params=params, verify=False)
        print(f"📡 API Status: {response.status_code}")
        try:
            return response.json()
        except Exception as e:
            print(f"❌ JSON Error: {e}")
            return []

    def check_aliexpress_availability(self, url):
        """Check if product is available on AliExpress via scraping."""
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return False
            
            soup = BeautifulSoup(response.text, 'html.parser')
            # Look for common 'unavailable' or 'not found' indicators
            if "Page Not Found" in response.text or "Security Verification" in response.text:
                return True # Assume available if blocked to be safe, or handle differently
            
            # This is a simplified check; AliExpress has highly dynamic content
            if "item-not-found" in response.text or "is no longer available" in response.text:
                return False
            
            return True
        except Exception as e:
            print(f"Error checking {url}: {e}")
            return True # Don't delete on error

    def calculate_new_price(self, cost_price, margin_multiplier=2.0, addition=15.0):
        """
        Rule: (Cost * Multiplier + Addition) rounded up to nearest integer.
        Example: €5.45 -> €25.45 -> €26.00
        """
        price = Decimal(str(cost_price)) * Decimal(str(margin_multiplier)) + Decimal(str(addition))
        return int(price.to_integral_value(rounding=ROUND_CEILING))

    def update_product_price(self, product_id, new_price):
        """Update product price in WooCommerce."""
        endpoint = f"{self.url}/wp-json/wc/v3/products/{product_id}"
        params = {
            "consumer_key": self.key,
            "consumer_secret": self.secret
        }
        data = {"regular_price": str(new_price)}
        response = requests.put(endpoint, params=params, json=data, verify=False)
        return response.status_code == 200

    def delete_product(self, product_id):
        """Delete a product permanently."""
        endpoint = f"{self.url}/wp-json/wc/v3/products/{product_id}"
        response = requests.delete(endpoint, auth=self._get_auth(), params={"force": True})
        if response.status_code == 200:
            print(f"🗑️ Product {product_id} deleted successfully.")
        return response.json()

    def _get_auth(self):
        return (self.key, self.secret)

    def run_cleanup(self, limit=1800):
        """Main loop to clean and price products."""
        page = 1
        processed = 0
        
        while processed < limit:
            print(f"📦 Fetching page {page}...")
            products = self.get_products(page=page)
            if not products or "message" in products:
                break
            
            for p in products:
                p_id = p['id']
                name = p['name']
                
                # 1. Simple Availability Check (Simulated or specific URL if found in meta)
                # In a real scenario, we'd extract the AliExpress URL from product meta or attributes
                # For now, we simulate the logic:
                print(f"🔍 Checking: {name} (ID: {p_id})")
                
                # 2. Pricing Rule: (Cost * 2 + 15) -> Round Up
                try:
                    current_price = float(p.get('regular_price', 0) or 0)
                    if current_price > 0:
                        new_price = self.calculate_new_price(current_price)
                        if str(new_price) != p.get('regular_price'):
                            print(f"💰 Updating Price: {current_price} -> {new_price}")
                            self.update_product_price(p_id, new_price)
                except Exception as e:
                    print(f"⚠️ Price Error: {e}")
                
                processed += 1
                if processed >= limit: break
            
            page += 1
            time.sleep(1) # Breath for the server

if __name__ == "__main__":
    agent = LifecycleAgent()
    print("🚀 Starting Inventory Curation Loop...")
    agent.run_cleanup(limit=20) # Small batch for verification
