 <!-- XSLT template for the comments files like BadConf.xml -->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
    <xsl:template match="/">
        <html>
            <body>
                <h1>
                    <xsl:value-of select="//head" />
                </h1>
                <xsl:for-each select="//p">
                    <p>
                        <xsl:for-each select="w">
                            <span>
                                <xsl:attribute name="id">
                                    <xsl:value-of select="@xml:id" />
                                </xsl:attribute>
                                <xsl:value-of select="." />
                                <xsl:text> </xsl:text>
                            </span>
                        </xsl:for-each>
                        <xsl:for-each select="hi"><em>
                                <xsl:for-each select="w">
                                    <span>
                                        <xsl:attribute name="id">
                                            <xsl:value-of select="@xml:id" />
                                        </xsl:attribute>
                                        <xsl:value-of select="." />
                                        <xsl:text> </xsl:text>
                                    </span>
                                </xsl:for-each>
                            </em>
                        </xsl:for-each>
                    </p>
                </xsl:for-each>
            </body>
        </html>
    </xsl:template>

</xsl:stylesheet>