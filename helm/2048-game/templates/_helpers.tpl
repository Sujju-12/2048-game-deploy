{{- define "2048-game.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "2048-game.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s" (default .Chart.Name .Values.nameOverride) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "2048-game.labels" -}}
app.kubernetes.io/name: {{ include "2048-game.name" . }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app: 2048-game
{{- end }}

{{- define "2048-game.selectorLabels" -}}
app.kubernetes.io/name: {{ include "2048-game.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app: 2048-game
{{- end }}
