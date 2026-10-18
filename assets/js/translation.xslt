<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0">
    <xsl:output method="html" doctype-system="about:legacy-compat" />

    <xsl:template match="/">

                <h1>
                    <xsl:value-of select="//title" />
                </h1>
                <xsl:apply-templates select="//div" />

    </xsl:template>

    <xsl:template match="div">
        <div>
            <xsl:if test="@type = 'notes'">
                <xsl:attribute name="class">footnotes</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates select="./*" />
        </div>
    </xsl:template>

    <xsl:template match="p">
        <p>
            <xsl:apply-templates />
        </p>
    </xsl:template>

   <xsl:template match="note">
    <xsl:choose>
        <xsl:when test="@type = 'comm' or @type = 'translation'">
            <!-- For type='comm', wrap inside <p> tags -->
                <span class="scroll-item">
                    <xsl:attribute name="data-related-id">
                        <xsl:call-template name="getNumbers">
                            <xsl:with-param name="string" select="substring-after(@target, '#')"/>
                        </xsl:call-template>
                    </xsl:attribute>
                    <xsl:attribute name="data-end-id">
                        <xsl:call-template name="getNumbers">
                            <xsl:with-param name="string" select="substring-after(@targetEnd, '#')"/>
                        </xsl:call-template>
                    </xsl:attribute>
                    <xsl:apply-templates />
                </span>
        </xsl:when>
        <xsl:when test="@type = 'fn'">
            <!-- footnote text, in <div type="notes"> at the end of the chapter -->
            <p class="footnote"><sup><xsl:value-of select="@n" /></sup><xsl:text> </xsl:text><xsl:value-of select="." /></p>
        </xsl:when>
        <xsl:when test="@type = 'insertion'">
            <!-- translator's addition: translated text with no Italian counterpart -->
            <span class="insertion" title="Aggiunta del traduttore"><xsl:value-of select="normalize-space(.)" /></span>
            <xsl:text> </xsl:text>
        </xsl:when>
        <xsl:when test="@type = 'omission'">
            <!-- Italian left untranslated: a marker linked to the Italian words, so hovering it shows them -->
            <span class="scroll-item omission" title="Non tradotto">
                <xsl:attribute name="data-related-id">
                    <xsl:call-template name="getNumbers">
                        <xsl:with-param name="string" select="substring-after(@target, '#')"/>
                    </xsl:call-template>
                </xsl:attribute>
                <xsl:attribute name="data-end-id">
                    <xsl:call-template name="getNumbers">
                        <xsl:with-param name="string" select="substring-after(@targetEnd, '#')"/>
                    </xsl:call-template>
                </xsl:attribute>
                <xsl:text>[…]</xsl:text>
            </span>
        </xsl:when>
        <xsl:otherwise>
            <xsl:apply-templates/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>

 <xsl:template name="getNumbers">
        <xsl:param name="string"/>
        <xsl:if test="string-length($string) &gt; 0">
            <xsl:variable name="char" select="substring($string, 1, 1)"/>
            <xsl:choose>
                <xsl:when test="$char &gt;= '0' and $char &lt;= '9'">
                    <xsl:value-of select="$char"/>
                </xsl:when>
            </xsl:choose>
            <xsl:call-template name="getNumbers">
                <xsl:with-param name="string" select="substring($string, 2)"/>
            </xsl:call-template>
        </xsl:if>
    </xsl:template>

    <xsl:template match="ref[@rend='bold']">
        <strong>
            <xsl:value-of select="." />
        </strong>
    </xsl:template>

    <xsl:template match="note/text()">
        <xsl:value-of select="." />
    </xsl:template>

    <!-- footnote mark: <ref type="fn" n="1"/> in the text -->
    <xsl:template match="ref[@type='fn']">
        <sup class="fn-ref"><xsl:value-of select="@n" /></sup>
    </xsl:template>


    <xsl:template match="hi[@rend='italic'] | rs[@rend='italic'] | bibl | rs | persName | placeName ">
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