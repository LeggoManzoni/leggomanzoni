<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" />
  <xsl:template match="/">

        <h1>
          <xsl:value-of select="//head" />
        </h1>
        <xsl:apply-templates select="//p" />

  </xsl:template>
  <xsl:template match="p">
    <p>
      <xsl:apply-templates select="./*" />
    </p>
  </xsl:template>
  <xsl:template match="w">
        <span class="hover-item">
            <xsl:attribute name="data-id">
                <xsl:call-template name="getNumbers">
                    <xsl:with-param name="string" select="@xml:id"/>
                </xsl:call-template>
            </xsl:attribute>
            <xsl:value-of select="." />
            <xsl:text> </xsl:text>
        </span>
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
<xsl:template match="hi[@rend='italic']">
    <i>
      <xsl:apply-templates />
    </i>
  </xsl:template>

  <!-- The 2026 documentary-text Quarantana carries no <graphic>: its 438
       illustrations are referenced by @facs into facsimile.xml and by @corresp
       into the FICLIT digital library. Emitting <img> with an empty src would
       put a broken-image placeholder in every chapter, so a figure renders only
       when it actually carries a local url. Remove the xsl:if to restore the
       unconditional behaviour. -->
  <xsl:template match="figure">
    <xsl:if test="graphic/@url">
      <div class="thumbnail">
        <img class="float-left m-3" src="{graphic/@url}" alt="Responsive image">
          <xsl:attribute name="style">
            <xsl:choose>
              <xsl:when test="parent::p/@type = 'capolettera'">width: 30%;</xsl:when>
              <xsl:otherwise>width: 80%;</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </img>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template match="foreign">
    <span class="foreign">
      <xsl:apply-templates />
    </span>
  </xsl:template>

  <!-- Manzoni's own footnotes: rendered inline, bracketed via literal text
       so the spacing post-processing in convert.js can tidy the edges -->
  <xsl:template match="note[@place='bottom']">
    <span class="nota-manzoni">
      <xsl:text>[</xsl:text>
      <xsl:apply-templates />
      <xsl:text>]</xsl:text>
    </span>
  </xsl:template>

  <xsl:template match="bibl">
    <xsl:apply-templates />
  </xsl:template>
  <!-- Inline wrappers around body-text words (names, places, editorial
       additions): render their content transparently -->
  <xsl:template match="persName | placeName | orgName | add">
    <xsl:apply-templates />
  </xsl:template>
  <!-- Quotations from Manzoni's historical sources -->
  <xsl:template match="quote">
    <span class="quote-source">
      <xsl:apply-templates />
    </span>
  </xsl:template>

  <xsl:template match="quote[@rend='italic']">
    <i class="quote-source">
      <xsl:apply-templates />
    </i>
  </xsl:template>


</xsl:stylesheet>
