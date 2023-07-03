<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" />
  <xsl:template match="/">
    <html>
      <body>
        <h1>
          <xsl:value-of select="//head" />
        </h1>
        <xsl:apply-templates select="//p" />
      </body>
    </html>
  </xsl:template>
  <xsl:template match="p">
    <p>
      <xsl:apply-templates select="./*" />
    </p>
  </xsl:template>
  <xsl:template match="w">
   <span data-id="{@xml:id}" class="hover-item">
    <xsl:value-of select="." /><xsl:text> </xsl:text>
    </span>
  </xsl:template>
  <xsl:template match="hi[@rend='italic']">
    <i>
      <xsl:apply-templates />
    </i>
  </xsl:template>
</xsl:stylesheet>