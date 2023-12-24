// This hook is used to handle the operations related to the custom state: honeState
// currently it is used to assemble the data shape to db by the custom state

import { useState, useCallback } from 'react';
import { EditorState } from 'draft-js';
import {Article, Facet, ArticleFacetLink} from '../types/types';

// Define constants for block types
const ARTICLE_TITLE_BLOCK_TYPE = 'article-title';
const FACET_TITLE_SYMBOL = '$'; // Symbol to identify facet titles

const useHoneState = (initialEditorState) => {
    const [editorState, setEditorState] = useState(initialEditorState);
    const [lastBlockMap, setLastBlockMap] = useState(null);
    const [customState, setCustomState] = useState({ articles: [], facets: [], links: [] });

    // Function to check if a block has changed
    const hasBlockChanged = useCallback((block, blockMap) => {
        return !blockMap || !blockMap.get(block.getKey()) || block !== blockMap.get(block.getKey());
    }, []);

    // Function to update the custom state from the editor state
    const updateCustomState = useCallback((newEditorState) => {
        const contentState = newEditorState.getCurrentContent();
        const newBlockMap = contentState.getBlockMap();

        let currentArticle = null;
        let currentFacet = null;
        let articles = [];
        let facets = [];
        let links = [];

        newBlockMap.forEach((block) => {
            const text = block.getText();
            const isChanged = hasBlockChanged(block, lastBlockMap);

            if (newBlockMap.first().getKey() === block.getKey()) {
                // Processing the first block as the article title
                currentArticle = { id: block.getKey(), title: text, nonFacetContent: '', facets: [] };
                if (isChanged) {
                    articles.push(currentArticle);
                }
            } else if (text.startsWith(FACET_TITLE_SYMBOL + ' ')) {
                // Processing a block as a facet title
                currentFacet = { id: block.getKey(), title: text.substring(FACET_TITLE_SYMBOL.length + 1).trim(), content: '' };
                if (isChanged) {
                    facets.push(currentFacet);
                }
                if (currentArticle) {
                    currentArticle.facets.push(currentFacet);
                    links.push({ articleId: currentArticle.id, facetId: currentFacet.id });
                }
            } else {
                // Processing other blocks as content
                if (currentFacet && isChanged) {
                    currentFacet.content += text + '\n';
                } else if (currentArticle && isChanged) {
                    currentArticle.nonFacetContent += text + '\n';
                }
            }
        });

        setCustomState({ articles, facets, links });
        setLastBlockMap(newBlockMap);
    }, [lastBlockMap, hasBlockChanged]);

    // Function to handle editor state changes
    const handleEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
        updateCustomState(newEditorState);
    };

    return [editorState, handleEditorStateChange, customState];
};

export default useHoneState;
