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
<xsl:template match="hi[@rend='italic']">
    <i>
      <xsl:apply-templates />
    </i>
  </xsl:template>

  <xsl:template match="figure">
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
  </xsl:template>
</xsl:stylesheet>
