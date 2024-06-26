<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:hi="http://huygens.knaw.nl"
    xmlns:md="http://mondrian.huygens.knaw.nl/"
    exclude-result-prefixes="xs tei"
    version="2.0"
    xmlns:tei="http://www.tei-c.org/ns/1.0" >
    
    <xsl:output method="xhtml"/>
    
   
    <xsl:key name="anchor" match="tei:ptr" use="substring-after(@target,'#')"/>
    <xsl:key name="transpose" match="md:transpose" use="substring-after(@target,'#')"/>
    
    <xsl:template match="/">
        <html>     
            <head>
                <link rel="stylesheet" href="https://xmlschema.huygens.knaw.nl/mondriaan.css"/>
                <title><xsl:apply-templates select="/tei:TEI/tei:teiHeader[1]/tei:fileDesc[1]/tei:titleStmt[1]/tei:title[1]"></xsl:apply-templates></title>
            </head> 
            <body>
                <div><h3><xsl:apply-templates select="/tei:TEI/tei:teiHeader[1]/tei:fileDesc[1]/tei:titleStmt[1]/tei:title[1]"></xsl:apply-templates></h3>
                    <p><xsl:value-of select="fn:replace(base-uri(),'.+/','')"/></p>
                    <p>Afdruk vervaardigd: <xsl:value-of select="format-dateTime(fn:current-dateTime(),'[D01]-[M01]-[Y0001], [H]:[m01]')"/></p></div>
                <div><h3>Intro</h3>
                    <xsl:apply-templates select="//tei:div[@type='typednotes']/tei:note" mode="note"/></div>
                <div><h3>Brieftekst (leestekst)</h3>
                    <xsl:apply-templates select="//tei:div[@type='original']" mode="edited"/></div>
                <div><h3>Brieftekst (diplomatisch)</h3>
                    <xsl:apply-templates select="//tei:div[@type='original']" mode="diplomatic"/></div>
                <xsl:if test="//tei:div[@type='postalData']">
                    <div><h3>Postal data</h3>
                        <xsl:apply-templates select="//tei:div[@type='postalData']" mode="diplomatic"/></div>
                </xsl:if>
                <div><h3>Translation</h3>
                    <xsl:apply-templates select="//tei:div[@type='translation']" mode="edited"/></div>
                <div><h3>Typed notes</h3>
                    <xsl:apply-templates select="//tei:listAnnotation[@type='typednotes']" mode="note"/></div>
                <div><h3>Notes</h3>
                    <xsl:apply-templates select="//tei:listAnnotation[@type='notes']//tei:note" mode="note"/></div>
                <div><h3>Ongoing topics</h3>
                    <ol><xsl:apply-templates select="//tei:listAnnotation[@type='ogtnotes']//tei:note" mode="note"/></ol></div>
            </body>
        </html>
    </xsl:template>
    
    <xsl:template match="*" mode="#all">
        <xsl:apply-templates mode="#current"/>
    </xsl:template>

    <xsl:template match="tei:add" mode="diplomatic">
        <span class="add">
            <xsl:apply-templates mode="diplomatic"/>
        </span>
    </xsl:template>
    
    <xsl:template match="tei:c[@type='wbh']" mode="edited"/>
    
    <xsl:template match="tei:choice[tei:corr and tei:sic]" mode="edited">
        <xsl:apply-templates select="tei:corr" mode="edited"/>
    </xsl:template>
    
    <xsl:template match="tei:choice[tei:corr and tei:sic]" mode="diplomatic">
        <xsl:apply-templates select="tei:sic" mode="diplomatic"/>
    </xsl:template>
    
    <xsl:template match="tei:choice[tei:unclear]" mode="edited">
        <xsl:apply-templates select="tei:unclear[1]" mode="edited"/>
    </xsl:template>
    
    <xsl:template match="tei:choice[tei:unclear]" mode="diplomatic">
        <xsl:text>{</xsl:text>
        <xsl:for-each select="tei:unclear">
            <xsl:apply-templates select="." mode="diplomatic"/>
            <xsl:if test="position()&lt;last()">
                <xsl:text>|</xsl:text>
            </xsl:if>
        </xsl:for-each>
        <xsl:text>}</xsl:text>
        <xsl:apply-templates select="tei:sic" mode="diplomatic"/>
    </xsl:template>
    
    <xsl:template match="tei:closer" mode="edited">
        <p>
            <br/>
            <xsl:apply-templates mode="edited"/>
        </p>
    </xsl:template>
    
    <xsl:template match="tei:del" mode="edited"/>
    
    <xsl:template match="tei:del" mode="diplomatic">
        <span class="del">
            <xsl:apply-templates mode="diplomatic"/>
        </span>
    </xsl:template>
    
    <xsl:template match="tei:div" mode="#all">
        <xsl:apply-templates mode="#current"/>
    </xsl:template>
    
    <xsl:template match="tei:lb" mode="diplomatic">
        <br/>
    </xsl:template>
    
    <xsl:template match="tei:lb[ancestor::tei:opener]" mode="edited">
        <br/>
    </xsl:template>
    
    <xsl:template match="tei:note[ancestor::tei:listAnnotation[@type='notes'] and string-length(.) > 0]" mode="note">
        <div>
            [<xsl:value-of select="@n"/>]
            <xsl:apply-templates mode="note"/>
        </div>
    </xsl:template>
    
    <xsl:template match="tei:note[ancestor::tei:listAnnotation[@type='typednotes'] or ancestor::tei:listAnnotation[@type='ogtnotes']]" mode="note">        <div>
            <xsl:text>[</xsl:text>
            <i><xsl:value-of select="@type"/></i>
            <xsl:text>:] </xsl:text>
            <xsl:choose>
                <xsl:when test="string-length(.) = 0">
                    (geen data)
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates mode="note"/>
                </xsl:otherwise>
            </xsl:choose>
            <xsl:copy-of select="ancestor::tei:listAnnotation[@type='typednotes' or @type='ogtnotes']/comment()"/>
        </div>
    </xsl:template>

    <xsl:template match="tei:note[ancestor::tei:listAnnotation[@type='ogtnotes']]" mode="note">
        <li>
            <xsl:if test="@xml:id">
                <xsl:text>[</xsl:text>
                <i><xsl:value-of select="@xml:id"/></i>
                <xsl:text>] </xsl:text>
            </xsl:if>
            <xsl:choose>
                <xsl:when test="string-length(.) = 0">
                    (geen data)
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates mode="note"/>
                </xsl:otherwise>
            </xsl:choose>
        </li>
    </xsl:template>
    
    <xsl:template match="tei:opener" mode="edited">
        <p>
            <xsl:apply-templates mode="edited"/>
            <br/>
        </p>
    </xsl:template>
    
    <xsl:template match="tei:p" mode="edited">
        <p>
            <xsl:if test="preceding-sibling::tei:p and not(preceding-sibling::*[1][local-name()='space'])">
                <xsl:attribute name="class">indent</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates mode="edited"/>
        </p>
    </xsl:template>
    
    <xsl:template match="tei:p" mode="note">
        <p>
            <xsl:apply-templates mode="note"/>
        </p>
    </xsl:template>
    
    <xsl:template match="tei:pb" mode="diplomatic">
        <br/>
        <br/>
        <xsl:text>[</xsl:text>
        <xsl:choose>
            <xsl:when test="@n and string-length(@n) > 0">
                <xsl:value-of select="@n"/>
            </xsl:when>
            <xsl:otherwise>zp</xsl:otherwise>
        </xsl:choose>
        <xsl:text>]</xsl:text>
    </xsl:template>
    
    <xsl:template match="tei:postscript" mode="edited">
        <br/>
        <xsl:apply-templates mode="#current"/>
    </xsl:template>
    
    <xsl:template match="tei:ptr" mode="edited">
        <xsl:text>[</xsl:text>
        <xsl:number level="any" from="tei:div"/>
        <xsl:text>]</xsl:text>
    </xsl:template>
    
    <xsl:template match="tei:signed" mode="edited">
        <br/>
        <xsl:apply-templates mode="edited"/>
    </xsl:template>
    
    <xsl:template match="tei:space" mode="#all">
        <br/>
    </xsl:template>
    
    <xsl:template match="md:transpose" mode="edited">
        <xsl:apply-templates select="key('transpose',@xml:id)/node()" mode="edited"/>
    </xsl:template>
    
    <xsl:template match="md:transpose" mode="diplomatic">
        <xsl:text>[</xsl:text>
        <xsl:value-of select="substring-after(@target,'#i')"/>
        <xsl:text>: </xsl:text>
        <xsl:apply-templates mode="diplomatic"/>
        <xsl:text>]</xsl:text>
    </xsl:template>
    
    <xsl:template match="tei:unclear" mode="diplomatic">
        <xsl:choose>
            <xsl:when test="parent::tei:choice">
                <xsl:apply-templates mode="diplomatic"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:text>{</xsl:text>
                <xsl:apply-templates mode="diplomatic"/>
                <xsl:text>}</xsl:text>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="text()" mode="note">
        <xsl:variable name="rend" select="hi:getrend(.)"/>
        <xsl:choose>
            <xsl:when test="contains($rend,'italics')">
                <i><xsl:value-of select="."/></i>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="."/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="text()" mode="edited">
        <xsl:variable name="rend" select="hi:getrend(.)"/>
        <xsl:choose>
            <xsl:when test="contains($rend,'super')">
                <span class="super"><xsl:value-of select="."/></span>
            </xsl:when>
            <xsl:when test="contains($rend,'spaced') or (contains($rend,'underline') and not(ancestor::tei:signed))">
                <i><xsl:value-of select="."/></i>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="."/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:template match="text()" mode="diplomatic">
        <xsl:variable name="rend" select="hi:getrend(.)"/>
        <xsl:choose>
            <xsl:when test="contains($rend,'super')">
                <span class="super"><xsl:value-of select="."/></span>
            </xsl:when>
            <xsl:when test="contains($rend,'spaced') or (contains($rend,'underline') and not(ancestor::tei:signed))">
                <i><xsl:value-of select="."/></i>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="."/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
    <xsl:function name="hi:getrend">
        <xsl:param name="node"/>
        <xsl:variable name="hier">
            <xsl:choose>
                <xsl:when test="$node/@rend">
                    <xsl:value-of select="$node/@rend"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text></xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="verderop">
            <xsl:choose>
                <xsl:when test="$node/ancestor::*[@rend]">
                    <xsl:value-of select="hi:getrend($node/ancestor::*[@rend][1])"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text></xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:value-of select="concat($hier,concat(' ',$verderop))"/>
    </xsl:function>
    
</xsl:stylesheet>