import { defaultSchema } from '@atlaskit/adf-schema/schema-default';
import makeJiraSchema from '@atlaskit/adf-schema/schema-jira';
import { JIRATransformer } from '@atlaskit/editor-jira-transformer';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';

const AtlasKit = {
  defaultSchema,
  JIRATransformer,
  JSONTransformer,
  makeJiraSchema,
  
  // Helper function to extract image information from HTML
  extractImages: function(html) {
    const images = [];
    const imgRegex = /<img[^>]*>/gi;
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0];
      
      // Extract attributes using more specific patterns
      const srcMatch = imgTag.match(/src="([^"]*)"/i);
      const altMatch = imgTag.match(/alt="([^"]*)"/i);
      const widthMatch = imgTag.match(/width="([^"]*)"/i);
      const heightMatch = imgTag.match(/height="([^"]*)"/i);
      
      if (srcMatch) {
        const image = {
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : null,
          width: widthMatch ? parseInt(widthMatch[1]) : null,
          height: heightMatch ? parseInt(heightMatch[1]) : null,
          fullMatch: imgTag
        };
        
        images.push(image);
      }
    }
    
    return images;
  },
  
  // Helper function to extract images with their positions and context
  extractImagesWithPositions: function(html) {
    const images = [];
    const imgRegex = /<img[^>]*>/gi;
    let match;
    let imageIndex = 0;
    
    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0];
      const imgPosition = match.index;
      
      // Get the HTML before this image to determine context
      const htmlBeforeImage = html.substring(0, imgPosition);
      
      // Find the last content block before this image (paragraph, heading, list, etc.)
      const lastContentMatch = htmlBeforeImage.match(/<(p|h[1-6]|ul|ol|li|div|section)[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/(p|h[1-6]|ul|ol|li|div|section)>/gi);
      const contextText = lastContentMatch ? lastContentMatch[lastContentMatch.length - 1].replace(/<[^>]*>/g, '').trim() : '';
      
      // Count all content blocks before this image (paragraphs, headings, lists, etc.)
      const allContentBlocks = htmlBeforeImage.match(/<(p|h[1-6]|ul|ol|li|div|section)[^>]*>/gi);
      let contentBlockCount = 0;
      if (allContentBlocks) {
        contentBlockCount = allContentBlocks.length;
      }
      
      // Extract attributes using more specific patterns
      const srcMatch = imgTag.match(/src="([^"]*)"/i);
      const altMatch = imgTag.match(/alt="([^"]*)"/i);
      const widthMatch = imgTag.match(/width="([^"]*)"/i);
      const heightMatch = imgTag.match(/height="([^"]*)"/i);
      
      if (srcMatch) {
        const image = {
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : null,
          width: widthMatch ? parseInt(widthMatch[1]) : null,
          height: heightMatch ? parseInt(heightMatch[1]) : null,
          fullMatch: imgTag,
          contextText: contextText,
          contentBlockIndex: contentBlockCount,
          imageIndex: imageIndex
        };
        
        images.push(image);
        imageIndex++;
      }
    }
    
    return images;
  },
  
  // Helper function to extract text content from a paragraph node
  extractTextFromParagraph: function(paragraphNode) {
    if (!paragraphNode.content) return '';
    
    let text = '';
    for (const node of paragraphNode.content) {
      if (node.type === 'text') {
        text += node.text;
      } else if (node.type === 'hardBreak') {
        text += '\n';
      }
    }
    return text;
  },
  
  // Helper function to create ADF media node
  createMediaNode: function(image) {
    // Use default dimensions if not provided
    const defaultWidth = 400;
    const defaultHeight = 300;
    
    return {
      type: "mediaSingle",
      attrs: {
        layout: "center"
      },
      content: [
        {
          type: "media",
          attrs: {
            type: "external",
            url: image.src,
            height: image.height || defaultHeight,
            width: image.width || defaultWidth
          }
        }
      ]
    };
  },
  
  // Helper function to preprocess HTML for AtlasKit compatibility
  preprocessHTML: function(html) {
    return html
      // Convert semantic tags to AtlasKit-supported tags
      .replace(/<strong\b[^>]*>/gi, '<b>')
      .replace(/<\/strong>/gi, '</b>')
      .replace(/<i\b[^>]*>/gi, '<em>')
      .replace(/<\/i>/gi, '</em>')
      // Convert other unsupported tags to supported equivalents
      .replace(/<mark\b[^>]*>/gi, '<b>')  // Convert mark to bold
      .replace(/<\/mark>/gi, '</b>')
      .replace(/<small\b[^>]*>/gi, '<em>')  // Convert small to italic
      .replace(/<\/small>/gi, '</em>')
      .replace(/<big\b[^>]*>/gi, '<b>')  // Convert big to bold
      .replace(/<\/big>/gi, '</b>')
      // Convert deprecated tags
      .replace(/<strike\b[^>]*>/gi, '<del>')
      .replace(/<\/strike>/gi, '</del>')
      .replace(/<s\b[^>]*>/gi, '<del>')
      .replace(/<\/s>/gi, '</del>')
      .replace(/<u\b[^>]*>/gi, '<ins>')
      .replace(/<\/u>/gi, '</ins>')
      // Strip span tags entirely (preserve text content)
      .replace(/<span\b[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      // Remove IMG tags (we'll handle them separately)
      .replace(/<img[^>]*>/gi, '');
  },
  
  htmlToADF: function(html) {
    try {
      // Extract images with their positions before preprocessing
      const imagesWithPositions = this.extractImagesWithPositions(html);
      
      // Preprocess HTML to convert unsupported tags to supported ones
      const processedHtml = this.preprocessHTML(html);
      
      const jiraSchema = makeJiraSchema({
        allowLinks: true,
        allowLists: true,
        allowMentions: true,
        allowEmojis: true,
        allowAdvancedTextFormatting: true,
        allowSubSupMark: true,
        allowCodeBlock: true,
        allowBlockQuotes: true,
        allowMedia: true,
        allowTextColor: true,
        allowTables: true
      });
      
      const jiraTransformer = new JIRATransformer(jiraSchema);
      const pmNode = jiraTransformer.parse(processedHtml);
      
      if (pmNode && pmNode.content && pmNode.content.size > 0) {
        const adfTransformer = new JSONTransformer(jiraSchema);
        let adf = adfTransformer.encode(pmNode);
        
        // Check if JIRA schema produced valid content
        if (adf.content && adf.content.some(item => item === undefined)) {
          const adfTransformer2 = new JSONTransformer(defaultSchema);
          const adf2 = adfTransformer2.encode(pmNode);
          
          if (adf2.content && !adf2.content.some(item => item === undefined)) {
            adf = adf2; // Use default schema result
          }
        }
        
        // Insert images into the ADF content at their correct positions
        if (imagesWithPositions.length > 0) {
          const finalContent = [];
          let imageIndex = 0;
          let contentBlockCount = 0;
          
          for (let i = 0; i < adf.content.length; i++) {
            const item = adf.content[i];
            finalContent.push(item);
            
            // Count all content blocks (paragraphs, headings, lists, etc.)
            if (item.type === 'paragraph' || 
                item.type === 'heading' || 
                item.type === 'bulletList' || 
                item.type === 'orderedList' ||
                item.type === 'listItem') {
              contentBlockCount++;
            }
            
            // Insert image after the content block that corresponds to its position
            if (imageIndex < imagesWithPositions.length && 
                imagesWithPositions[imageIndex].contentBlockIndex === contentBlockCount) {
              finalContent.push(this.createMediaNode(imagesWithPositions[imageIndex]));
              imageIndex++;
            }
          }
          
          // Add any remaining images at the end (handles edge cases)
          while (imageIndex < imagesWithPositions.length) {
            finalContent.push(this.createMediaNode(imagesWithPositions[imageIndex]));
            imageIndex++;
          }
          
          adf.content = finalContent;
        }
        
        return adf;
      } else {
        throw new Error('Could not parse the HTML content');
      }
      
    } catch (error) {
      console.error('Error in htmlToADF:', error);
      throw error;
    }
  },

  adfToHTML: function(adf) {
    try {
      const jiraSchema = makeJiraSchema({
        allowLinks: true,
        allowLists: true,
        allowMentions: true,
        allowEmojis: true,
        allowAdvancedTextFormatting: true,
        allowSubSupMark: true,
        allowCodeBlock: true,
        allowBlockQuotes: true,
        allowMedia: true,
        allowTextColor: true,
        allowTables: true
      });
      
      const adfTransformer = new JSONTransformer(jiraSchema);
      const pmNode = adfTransformer.parse(adf);
      
      if (pmNode && pmNode.content && pmNode.content.size > 0) {
        const jiraTransformer = new JIRATransformer(jiraSchema);
        let html = jiraTransformer.encode(pmNode);
        
        // Convert mediaSingle nodes back to img tags
        if (adf.content) {
          const mediaNodes = [];
          
          // Find all mediaSingle nodes in the ADF
          adf.content.forEach((item, index) => {
            if (item.type === 'mediaSingle' && item.content && item.content[0] && item.content[0].type === 'media') {
              const media = item.content[0];
              if (media.attrs && media.attrs.url) {
                mediaNodes.push({
                  index: index,
                  url: media.attrs.url,
                  width: media.attrs.width,
                  height: media.attrs.height
                });
              }
            }
          });
          
          // Insert img tags at the appropriate positions
          if (mediaNodes.length > 0) {
            // Split HTML into parts and insert img tags
            const htmlParts = html.split('</p>');
            let mediaIndex = 0;
            
            for (let i = 0; i < htmlParts.length && mediaIndex < mediaNodes.length; i++) {
              if (htmlParts[i].includes('<p>')) {
                const mediaNode = mediaNodes[mediaIndex];
                const imgTag = `<img src="${mediaNode.url}"${mediaNode.width ? ` width="${mediaNode.width}"` : ''}${mediaNode.height ? ` height="${mediaNode.height}"` : ''}>`;
                htmlParts[i] = htmlParts[i] + imgTag;
                mediaIndex++;
              }
            }
            
            html = htmlParts.join('</p>');
          }
        }
        
        return html;
      } else {
        throw new Error('Could not parse the ADF content');
      }
      
    } catch (error) {
      throw error;
    }
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasKit;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return AtlasKit; });
} else if (typeof window !== 'undefined') {
  window.AtlasKit = AtlasKit;
}

export default AtlasKit;
