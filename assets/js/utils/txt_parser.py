import sys
import re
import xml.etree.ElementTree as ET
from xml_builder import create_xml


PARSED = {}
tree = ET.parse("intro.xml") 
root = tree.getroot()

class Comment():
    def __init__(self, text, number, source, tag, author):
        self.text = text
        self.line: str = ""
        self.comment: str = ""
        self.number: int = number
        self.start: int = None
        self.end: int = None
        self.line_start: str = ""
        self.line_end: str = ""
        self.status: str = ""
        self.source = source
        self.tag = tag
        self.author = author

    def __str__(self):
        end_line = f'targetEnd="quarantana/{self.source}.xml#{self.tag}_{self.end}"' if self.start != self.end else ""
        status = f'status="{self.status}"' if self.status != "OK" else ""
        result = f'<note {status} xml:id="{self.author}_{self.source}-n{self.number}" target="quarantana/{self.source}.xml#{self.tag}_{self.start}" {end_line}><ref rend="bold">{self.line}</ref>: {self.comment}</note>'
        return result

    def parse(self):
        parsed = self.text.split(":")
        if parsed[0]:
            self.line = parsed[0]
            self.comment = self.text[len(self.line)+1:]
        splitted = self.line.split("... ")
        if len(splitted) > 1:
            self.line_start, self.line_end = splitted[0], splitted[-1]
        else:
            self.line_start = splitted[0]
        self.find_origin()
        self.status = self.check()
        if self.status != "OK":
            print(self.number, self.line, self.start, self.end, self.status)

    def find_origin(self):
        start_ids = find_line_in_origin(self.line_start)
        if start_ids:
            self.start = start_ids[0]
        if self.line_end:
            end_ids = find_line_in_origin(self.line_end)
            if end_ids:
                self.end = end_ids[-1]
        else:
            if start_ids:
                self.end = start_ids[-1]

    def check(self):
        l = len(self.line.split(" "))
        if re.match(r"^\d+[-]*\d*[.]\s", self.line):
            l -= 1
        if not self.start:
            return "NOT OK"
        if self.start and self.end and l > 1:
            if self.start > self.end:
                return "NOT OK"
            elif l > (self.end - self.start + 1):
                return "NOT OK"

        return "OK"


def find_line_in_origin(line):
    ids = []
    if re.match(r"^\d+[-]*\d*[.]\s", line):
        line = re.sub(r"^\d+[-]*\d*[.]\s", "", line, 0, re.MULTILINE)
    for word in line.split(" "):
        word = clean(word)
        ids += [key for key, value in PARSED.items() if word == value]
    return check_sequence(sorted(ids), len(line.split(" ")))


sys.setrecursionlimit(2500)

def check_sequence(sequence, length):
    if len(sequence) <= 1:
        return sequence
    else:
        for i, number in enumerate(sequence):
            if i == 0:
                continue
            if number - 1 != sequence[i-1]:
                if len(sequence[:i]) == length:
                    return sequence[:i]
                return check_sequence(sequence[i:], length)
    return sequence


def parse_id(xml_id) -> int:
    return int(xml_id.split("_")[1])

def clean(word):
    return word.replace(".", "").replace(",", "").replace(":", "").replace("?", "").replace(";", "").replace("!", "").replace("»", "").replace("«", "").replace("...", "").replace(",»", "").replace('«', "").replace('!»', "")

def parse_xml(element, level=0):
    if element.tag == "w":
        id = element.attrib.get('{http://www.w3.org/XML/1998/namespace}id')
        PARSED[parse_id(id)] = clean(element.text)
    for child in element:
        parse_xml(child, level+1)

parse_xml(root)

def main(author):
    sources = [{
        "intro": {
            "xml": "intro.xml", "comments": f"{author}_intro.txt", "tag": "intro",
        }},
        {"cap1": {
            "xml": "cap1.xml", "comments": f"{author}_cap1.txt", "tag": "c1",
        }}, 
    ]
    comments_to_add = {}
    for source in sources:
        for name, values in source.items():
            tree = ET.parse(values["xml"]) 
            root = tree.getroot()
            parse_xml(root)
            comments_to_add[name] = []
            with open(values["comments"], "r") as f:
                lines = f.readlines()
                for number, line in enumerate(lines):
                    if line.strip():
                        number += 1
                        comment = Comment(
                            line.strip(),
                            number = number,
                            source=name,
                            tag=values["tag"],
                            author=author,
                            )
                        comment.parse()
                        comments_to_add[name].append(comment)
    create_xml(comments_to_add, author=author)


if __name__ == "__main__":
    main(author=sys.argv[1])
