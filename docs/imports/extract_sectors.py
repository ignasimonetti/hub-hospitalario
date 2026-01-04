import xml.etree.ElementTree as ET
import sys

def extract_sectors(file_path):
    try:
        # WordML uses namespaces
        ns = {'w': 'http://schemas.microsoft.com/office/word/2003/wordml'}
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        sectors = []
        for t in root.findall('.//w:t', ns):
            text = t.text.strip() if t.text else ""
            if text and text != '\xa0': # Ignorar espacios en blanco de Word
                sectors.append(text)
        
        # Eliminar duplicados manteniendo el orden
        seen = set()
        unique_sectors = [x for x in sectors if not (x in seen or seen.add(x))]
        
        for s in unique_sectors:
            print(s)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_sectors(sys.argv[1])
