import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import FACETs from './FACETs';
import * as indexedDBService from '../services/indexedDBService';
import { Facet, HoningRecord } from '../types/types';

const mockFetchAllFacets = jest.spyOn(indexedDBService, 'fetchAllFacets');
const mockFetchAllHoningRecord = jest.spyOn(indexedDBService, 'fetchAllHoningRecord');

const mockFacetsData: Facet[] = [
  {
    facetId: '1',
    articleId: 'article1',
    title: 'Facet1',
  },
  {
    facetId: '2',
    articleId: 'article2',
    title: 'Facet2',
  },
];

const mockHoningRecordData: HoningRecord[] = [
  {
    honedFacetId: '1',
    honingFacetId: '2',
  },
  {
    honedFacetId: '1',
    honingFacetId: '3',
  },
];

describe('Testing for FACETs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => <Router>{children}</Router>;

  it('renders and show facet title', async () => {
    mockFetchAllFacets.mockResolvedValue(mockFacetsData);
    mockFetchAllHoningRecord.mockResolvedValue(mockHoningRecordData);

    render(
      <Wrapper>
        <FACETs />
      </Wrapper>
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Facet/);
      elements.forEach((element, index) => {
        expect(element).toHaveTextContent(`Facet`);
      });
    });
  });

  it('displays "No facets yet." when no facets are present', async () => {
    mockFetchAllFacets.mockResolvedValue([]);
    mockFetchAllHoningRecord.mockResolvedValue([]);

    render(
      <Wrapper>
        <FACETs />
      </Wrapper>
    );
    expect(await screen.findByText('No facets yet.')).toBeInTheDocument();
  });

  it('calls fetchAllFacets and fetchAllHoningRecord on component mount', async () => {
    mockFetchAllFacets.mockResolvedValue(mockFacetsData);
    mockFetchAllHoningRecord.mockResolvedValue(mockHoningRecordData);

    render(
      <Wrapper>
        <FACETs />
      </Wrapper>
    );
    await waitFor(() => expect(indexedDBService.fetchAllFacets).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(indexedDBService.fetchAllHoningRecord).toHaveBeenCalledTimes(1));
  });
});
