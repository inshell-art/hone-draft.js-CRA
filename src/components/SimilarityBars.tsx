/**
 * SimilarityBars component is used to display the similarity of the facets
 */

import React from 'react';
import { SimilarityBarProps } from '../types/types';
import { similarityBar } from '../utils/utils';

const SimilarityBars = ({ similarity }: SimilarityBarProps) => {
  const similarityBars = similarityBar(similarity);
  const maxOpacity = similarityBars.reduce((max, bar) => Math.max(max, bar.opacity), 0).toFixed(2);

  return (
    <>
      {similarityBars.map((style, index) => (
        <span key={index} style={style}>
          ▮
        </span>
      ))}
      <span>
        {' '}
        {similarity.toFixed(3)} - {maxOpacity}
      </span>
    </>
  );
};

export default SimilarityBars;
