import React from 'react';
import { MetricSelect } from './MetricSelect';
import { PromVisualQuery } from '../types';
import { LabelFilters } from '../shared/LabelFilters';
import { OperationList } from '../shared/OperationList';
import { EditorRow } from '@grafana/experimental';
import { PrometheusDatasource } from '../../datasource';
import { NestedQueryList } from './NestedQueryList';
import { promQueryModeller } from '../PromQueryModeller';
import { QueryBuilderLabelFilter } from '../shared/types';
import { DataSourceApi, PanelData, SelectableValue } from '@grafana/data';
import { OperationsEditorRow } from '../shared/OperationsEditorRow';
import { PromQueryBuilderHints } from './PromQueryBuilderHints';
import { getMetadataString } from '../../language_provider';

export interface Props {
  query: PromVisualQuery;
  datasource: PrometheusDatasource;
  onChange: (update: PromVisualQuery) => void;
  onRunQuery: () => void;
  nested?: boolean;
  data?: PanelData;
}

export const PromQueryBuilder = React.memo<Props>(({ datasource, query, onChange, onRunQuery, data }) => {
  const onChangeLabels = (labels: QueryBuilderLabelFilter[]) => {
    onChange({ ...query, labels });
  };

  const withTemplateVariableOptions = async (
    optionsPromise: Promise<Array<{ value: string; description?: string }>>
  ): Promise<SelectableValue[]> => {
    const variables = datasource.getVariables();
    const options = await optionsPromise;
    return [
      ...variables.map((value) => ({ label: value, value })),
      ...options.map((option) => ({ label: option.value, value: option.value, tooltip: option.description })),
    ];
  };

  const onGetLabelNames = async (forLabel: Partial<QueryBuilderLabelFilter>): Promise<Array<{ value: string }>> => {
    // If no metric we need to use a different method
    if (!query.metric) {
      // Todo add caching but inside language provider!
      await datasource.languageProvider.fetchLabels();
      return datasource.languageProvider.getLabelKeys().map((k) => ({ value: k }));
    }

    const labelsToConsider = query.labels.filter((x) => x !== forLabel);
    labelsToConsider.push({ label: '__name__', op: '=', value: query.metric });
    const expr = promQueryModeller.renderLabels(labelsToConsider);
    const labelsIndex = await datasource.languageProvider.fetchSeriesLabels(expr);

    // filter out already used labels
    return Object.keys(labelsIndex)
      .filter((labelName) => !labelsToConsider.find((filter) => filter.label === labelName))
      .map((k) => ({ value: k }));
  };

  const onGetLabelValues = async (forLabel: Partial<QueryBuilderLabelFilter>) => {
    if (!forLabel.label) {
      return [];
    }

    // If no metric we need to use a different method
    if (!query.metric) {
      return (await datasource.languageProvider.getLabelValues(forLabel.label)).map((v) => ({ value: v }));
    }

    const labelsToConsider = query.labels.filter((x) => x !== forLabel);
    labelsToConsider.push({ label: '__name__', op: '=', value: query.metric });
    const expr = promQueryModeller.renderLabels(labelsToConsider);
    const result = await datasource.languageProvider.fetchSeriesLabels(expr);
    const forLabelInterpolated = datasource.interpolateString(forLabel.label);
    return result[forLabelInterpolated].map((v) => ({ value: v })) ?? [];
  };

  const onGetMetrics = async () => {
    if (!datasource.languageProvider.metricsMetadata) {
      // TODO this is doing more than is needed
      await datasource.languageProvider.start();
    }

    let metrics;
    if (query.labels.length > 0) {
      const expr = promQueryModeller.renderLabels(query.labels);
      metrics = (await datasource.languageProvider.getSeries(expr, true))['__name__'] ?? [];
    } else {
      metrics = (await datasource.languageProvider.getLabelValues('__name__')) ?? [];
    }

    return metrics.map((m) => ({
      value: m,
      description: getMetadataString(m, datasource.languageProvider.metricsMetadata!),
    }));
  };

  return (
    <>
      <EditorRow>
        <MetricSelect
          query={query}
          onChange={onChange}
          onGetMetrics={() => withTemplateVariableOptions(onGetMetrics())}
        />
        <LabelFilters
          labelsFilters={query.labels}
          onChange={onChangeLabels}
          onGetLabelNames={(forLabel: Partial<QueryBuilderLabelFilter>) =>
            withTemplateVariableOptions(onGetLabelNames(forLabel))
          }
          onGetLabelValues={(forLabel: Partial<QueryBuilderLabelFilter>) =>
            withTemplateVariableOptions(onGetLabelValues(forLabel))
          }
        />
      </EditorRow>
      <OperationsEditorRow>
        <OperationList<PromVisualQuery>
          queryModeller={promQueryModeller}
          datasource={datasource as DataSourceApi}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
        />
        <PromQueryBuilderHints datasource={datasource} query={query} onChange={onChange} data={data} />
      </OperationsEditorRow>
      {query.binaryQueries && query.binaryQueries.length > 0 && (
        <NestedQueryList query={query} datasource={datasource} onChange={onChange} onRunQuery={onRunQuery} />
      )}
    </>
  );
});

PromQueryBuilder.displayName = 'PromQueryBuilder';
