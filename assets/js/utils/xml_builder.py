from lxml import etree
from datetime import datetime


def create_xml(notes: list, author: str):
    ns = {"tei": "http://www.tei-c.org/ns/1.0"}
    root = etree.Element("TEI", nsmap=ns)
    header = etree.SubElement(root, "teiHeader")
    text = etree.SubElement(root, "text")
    fileDesc = etree.SubElement(header, "fileDesc")
    titleStmt = etree.SubElement(fileDesc, "titleStmt")
    
    title = etree.SubElement(titleStmt, "title")
    title.text = author
    respStmt = etree.SubElement(titleStmt, "respStmt")
    resp = etree.SubElement(respStmt, "resp")
    resp.text = "Correzione e codifica"
    persName = etree.SubElement(respStmt, "persName")
    persName.set("{http://www.w3.org/XML/1998/namespace}id", "ER")
    persName.text = "Ersilia Russo"

    publicationStmt = etree.SubElement(fileDesc, "publicationStmt")
    publisher = etree.SubElement(publicationStmt, "publisher")
    publisher.text = "Leggo Manzoni. Quaranta commenti alla Quarantana"
    pubPlace = etree.SubElement(publicationStmt, "pubPlace")
    pubPlace.text = 'Università di Bologna "Alma mater studiorum"'
    date = etree.SubElement(publicationStmt, "date")
    date.text = "2023"
    availability = etree.SubElement(publicationStmt, "availability")
    availability_p = etree.SubElement(availability, "p")
    availability_p.text = "Questa risorsa digitale è liberamente accessibile per uso personale o scientifico. Ogni uso commerciale è vietato."

    sourceDesc = etree.SubElement(fileDesc, "sourceDesc")
    bibl = etree.SubElement(sourceDesc, "bibl")
    author_element = etree.SubElement(bibl, "author")
    author_element.text = "Alessandro Manzoni"
    title = etree.SubElement(bibl, "title")
    title.text = f"I promessi sposi :  a cura di {author}"
    editor = etree.SubElement(bibl, "editor")
    editor.text = author
    pubPlace = etree.SubElement(bibl, "pubPlace")
    pubPlace.text = "Milano"
    publisher = etree.SubElement(bibl, "publisher")
    publisher.text = "Tascabili Bompiani"
    date = etree.SubElement(bibl, "date")
    date.text = "1990"
    revisionDesc = etree.SubElement(header, "revisionDesc")
    listChange = etree.SubElement(revisionDesc, "listChange")
    change = etree.SubElement(listChange, "change")
    change.set("who", "ML")
    change.set("when", datetime.today().strftime('%Y-%m-%d'))
    change.text = "Prima edizione digitale"
 
    body = etree.SubElement(text, "body")
    for name, spisok in notes.items():
        div = etree.SubElement(body, "div")
        id = f"{author}_{name}"
        print(id, len(spisok))
        div.set("{http://www.w3.org/XML/1998/namespace}id", id)
        for note in spisok:
            to_add = note.__str__()
            try:
                div.append(etree.XML(to_add))
            except BaseException as e:
                print(e, to_add)

    xml_string = etree.tostring(root, pretty_print=True, xml_declaration=False, encoding="UTF-8")
    filename = f"{author}.xml"
    
    with open(filename, "wb") as f:  # write as binary to avoid encoding issues
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write(b'<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>\n')
        f.write(b'<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>\n')
        f.write(xml_string)

