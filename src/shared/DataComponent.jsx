import React from 'react';
import { Alert } from '@mui/material';

/**
 * A component that handles different data states (loading, error, empty) and renders appropriate content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.loadingComponent - Component to show during loading state
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @param {React.ReactNode} props.emptyComponent - Component to show when data is empty
 * @param {boolean} props.isEmpty - Whether data is empty
 * @param {React.ReactNode} [props.errorComponent] - Optional component to show when there is an error
 * @param {boolean} props.hasError - Whether there is an error
 * @param {boolean} [props.showLoadingOnFirstLoadOnly=false] - If true, show loading only on initial load and keep showing the last successful content during subsequent refetches
 * @param {React.ReactNode} props.children - Content to render when data is loaded successfully
 * @returns {React.ReactNode} The appropriate component based on data state
 * @example
 * <DataComponent
 *   loadingComponent={<Spinner />}
 *   isLoading={loading}
 *   emptyComponent={<EmptyState />}
 *   isEmpty={data.length === 0}
 *   errorComponent={<ErrorMessage />}
 *   hasError={!!error}
 *   showLoadingOnFirstLoadOnly
 * >
 *   <DataTable data={data} />
 * </DataComponent>
 */
function DataComponent({
  loadingComponent,
  isLoading,
  emptyComponent,
  isEmpty,
  errorComponent,
  hasError,
  showLoadingOnFirstLoadOnly = false,
  children,
}) {
  const hasLoadedOnceRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoading && !hasError) {
      hasLoadedOnceRef.current = true;
    }
  }, [isLoading, hasError]);

  if (isLoading) {
    if (showLoadingOnFirstLoadOnly && hasLoadedOnceRef.current) {
      return children;
    }
    return loadingComponent;
  }

  if (hasError && errorComponent) {
    return errorComponent;
  }

  if (hasError) {
    return <Alert severity='error'>Error loading data</Alert>;
  }

  if (isEmpty) {
    return emptyComponent;
  }

  return children;
}

export default DataComponent;
