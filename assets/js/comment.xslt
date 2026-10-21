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
            <xsl:apply-templates select="./*" />
        </div>
    </xsl:template>

   <xsl:template match="note">
    <xsl:choose>
        <xsl:when test="@type = 'comment'">
            <!-- For type='comment', wrap inside <p> tags -->
            <p>
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
            </p>
        </xsl:when>
        <xsl:otherwise>
            <xsl:apply-templates/>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>

 <xsl:template name="getNumbers">
    <!-- Order key of a Quarantana token id: the chapter digits, the 5-digit token number, and a 2-digit
         rank for an id suffix (none 00, a or _1 01, b or _b 02, ...). Ids with a suffix (c13_11456b, the
         word restored after c13_11456; c18_14815_1, a split) so keep reading order and never share the
         key of their base word. c13_11456 -> 131145600, c13_11456b -> 131145602, intro_10001 -> 1000100.
         The same rule is idKey() in combined_viewer.js and concordanza.js. -->
    <xsl:param name="string"/>
    <xsl:if test="string-length($string) &gt; 0">
      <xsl:variable name="tail" select="substring-after($string, '_')"/>
      <xsl:variable name="suffix" select="translate(substring($tail, 6), '_', '')"/>
      <xsl:value-of select="translate(substring-before($string, '_'), 'abcdefghijklmnopqrstuvwxyz', '')"/>
      <xsl:value-of select="substring($tail, 1, 5)"/>
      <xsl:choose>
        <xsl:when test="$suffix = ''">00</xsl:when>
        <xsl:when test="string-length($suffix) = 1 and contains('123456789', $suffix)">
          <xsl:value-of select="concat('0', $suffix)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat('0', string-length(substring-before('abcdefghi', $suffix)) + 1)"/>
        </xsl:otherwise>
      </xsl:choose>
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