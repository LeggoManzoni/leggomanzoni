<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0">
    <xsl:output method="html" doctype-system="about:legacy-compat" />

    <xsl:template match="/">
        <html>
            <body>
                <h1>
                    <xsl:value-of select="//title" />
                </h1>
                <xsl:apply-templates select="//div" />
            </body>
        </html>
    </xsl:template>

    <xsl:template match="div">
        <div>
            <xsl:apply-templates select="//note" />
        </div>
    </xsl:template>

    <xsl:template match="note">
        <xsl:choose>
            <xsl:when test="@type = 'comm'">
                <!-- For type='comm', wrap inside <p> tags -->
                <p>
                    <span id="{substring-after(@target, '#')}">
                        <xsl:apply-templates />
                    </span>
                </p>
            </xsl:when>
            <xsl:otherwise>
                <!-- For other types, do not wrap inside <p> tags -->
               <xsl:value-of select="." />
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

    <xsl:template match="ref[@rend='bold']">
        <strong>
            <xsl:value-of select="." />
        </strong>
    </xsl:template>

    <xsl:template match="note/text()">
        <xsl:value-of select="." />
    </xsl:template>

    <xsl:template match="hi[@rend='italic'] | rs[@rend='italic'] | bibl | rs">
        <em>
            <xsl:value-of select="." />
        </em>
    </xsl:template>

    <xsl:template match="note/figure">
    <a>
        <xsl:attribute name="href">
            <xsl:text>javascript:void(0);</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="onclick">
            <xsl:text>window.open('</xsl:text>
            <xsl:value-of select="graphic/@url"/>
            <xsl:text>', 'popup', 'width=600,height=600'); return false;</xsl:text>
        </xsl:attribute>
        <strong>
            <xsl:value-of select="figDesc"/>
        </strong>
    </a>
</xsl:template>



</xsl:stylesheet>