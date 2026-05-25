{{/*
Expand the name of the chart.
*/}}
{{- define "remediai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "remediai.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "remediai.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: remediai
{{- end }}

{{/*
Selector labels for a given component.
Usage: include "remediai.selectorLabels" (dict "Values" .Values "component" "api")
*/}}
{{- define "remediai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "remediai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Full image reference: registry/image:tag
*/}}
{{- define "remediai.image" -}}
{{- printf "%s/%s:%s" .Values.global.registry .image .Values.global.imageTag }}
{{- end }}
