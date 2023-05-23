 <!-- XSLT template for the comments files like BadConf.xml -->

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:tei="http://www.tei-c.org/ns/1.0"
exclude-result-prefixes="tei">
    <xsl:output method="html"/>
    <xsl:template match="/">
        <html>
            <body>
                <h1><xsl:value-of select="//tei:title"/></h1>
                <h2>Publication Details</h2>
                <p>Publisher: <xsl:value-of select="//tei:publicationStmt/tei:publisher"/></p>
                <p>Publication Place: <xsl:value-of select="//tei:publicationStmt/tei:pubPlace"/></p>
                <p>Date: <xsl:value-of select="//tei:publicationStmt/tei:date"/></p>
                <p>Availability: <xsl:value-of select="//tei:publicationStmt/tei:availability/tei:p"/></p>
                <h2>Source Description</h2>
                <p><strong>Author: </strong> <xsl:value-of select="//tei:bibl/tei:author"/></p>
                <p><strong>Title: </strong> <xsl:value-of select="//tei:bibl/tei:title"/></p>
                <p><strong>Editor: </strong> <xsl:value-of select="//tei:bibl/tei:editor"/></p>
                <p><strong>Publication Place: </strong> <xsl:value-of select="//tei:bibl/tei:pubPlace"/></p>
                <p><strong>Publisher: </strong> <xsl:value-of select="//tei:bibl/tei:publisher"/></p>
                <p><strong>Date: </strong> <xsl:value-of select="//tei:bibl/tei:date"/></p>
                <h2>Comments</h2>
                <xsl:apply-templates select="//tei:div"/>
                
            </body>
        </html>
    </xsl:template>


    <xsl:template match="tei:sourceDesc">
    </xsl:template>

<xsl:template match="tei:div">
    <div>
        <h2><xsl:value-of select="@xml:id"/></h2>
        <xsl:apply-templates select="//tei:div/tei:note"/>
    </div>
</xsl:template>

<xsl:template match="tei:note">
  <p><xsl:apply-templates/></p>
</xsl:template>

<xsl:template match="tei:ref[@rend='bold']">
  <b><xsl:value-of select="."/></b>
</xsl:template>

</xsl:stylesheet>
