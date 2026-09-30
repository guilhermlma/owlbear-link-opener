#!/usr/bin/env python3
"""
Servidor local de desenvolvimento com suporte a CORS para o Owlbear Rodeo.
Permite testar a extensão localmente sem precisar compilar nada.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import mimetypes

# Garante tipos MIME corretos para navegadores e iframes
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/css", ".css")

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run(port=5173):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print("=" * 60)
    print(f"[*] Extensao Link Opener pronta para o Owlbear Rodeo!")
    print(f"[*] Servindo em: http://localhost:{port}")
    print(f"[*] URL do Manifesto: http://localhost:{port}/manifest.json")
    print("=" * 60)
    print("\nPara instalar no Owlbear Rodeo:")
    print("1. Abra https://owlbear.app")
    print("2. Va no seu Perfil (canto inferior esquerdo) > Extensions > +")
    print(f"3. Cole a URL: http://localhost:{port}/manifest.json")
    print("4. Ative a extensao na sala e clique com botao direito em qualquer token!\n")
    print("Pressione Ctrl+C para encerrar o servidor.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    run(port)
