#!/usr/bin/env python3
"""
Servidor local de desenvolvimento com suporte a CORS para o Owlbear Rodeo.
Permite testar a extensão localmente sem precisar compilar nada.
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import mimetypes
import json

# Garante tipos MIME corretos para navegadores e iframes
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("text/css", ".css")

CURRENT_PORT = 5173

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

    def do_GET(self):
        # Reescreve dinamicamente as URLs do manifest para localhost durante o teste local
        if self.path in ("/manifest.json", "/public/manifest.json"):
            try:
                with open("manifest.json", "r", encoding="utf-8") as f:
                    content = f.read()
                local_content = content.replace(
                    "https://guilhermlma.github.io/owlbear-link-opener/",
                    f"http://localhost:{CURRENT_PORT}/"
                )
                encoded = local_content.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)
                return
            except Exception as e:
                print(f"[!] Erro ao servir manifest local: {e}")
        
        super().do_GET()

def run(port=5173):
    global CURRENT_PORT
    CURRENT_PORT = port
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print("=" * 60)
    print(f"[*] Extensao Link Opener pronta para o Owlbear Rodeo!")
    print(f"[*] Servindo em: http://localhost:{port}")
    print(f"[*] URL do Manifesto Local: http://localhost:{port}/manifest.json")
    print("=" * 60)
    print("\nPara instalar no Owlbear Rodeo (teste local):")
    print("1. Abra https://owlbear.app")
    print("2. Va no seu Perfil (canto inferior esquerdo) > Extensions > +")
    print(f"3. Cole a URL: http://localhost:{port}/manifest.json")
    print("4. Ative a extensao na sala e use o botao na barra ou clique com botao direito em qualquer token!\n")
    print("Pressione Ctrl+C para encerrar o servidor.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    run(port)
