import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import highcharts3dModule from "highcharts/highcharts-3d";
import type { DrilldownDataPoint, MetricType } from '../../types/analytics';

// Inicialização segura do módulo 3D sem usar 'any'
if (typeof highcharts3dModule === 'function') {
  (highcharts3dModule as unknown as (hc: typeof Highcharts) => void)(Highcharts);
} else if (
  highcharts3dModule && 
  typeof (highcharts3dModule as unknown as { default?: (hc: typeof Highcharts) => void }).default === 'function'
) {
  (highcharts3dModule as unknown as { default: (hc: typeof Highcharts) => void }).default(Highcharts);
}

const HIGHCHARTS_COLORS = [
  '#2F80ED', '#EB5757', '#7CB518', '#8E44AD', '#F2994A', '#06b6d4', 
  '#eab308', '#84cc16', '#22c55e', '#f43f5e', '#6366f1', '#a855f7'
];

interface PieChartDrilldownProps {
  data: DrilldownDataPoint[];
  metric: MetricType;
  onClickSlice: (entry: DrilldownDataPoint) => void;
}

interface CustomPoint extends Highcharts.Point {
  formattedValue?: string;
  customData?: DrilldownDataPoint;
}

export function PieChartDrilldown({ data, metric, onClickSlice }: PieChartDrilldownProps) {
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const total = data.reduce((acc, item) => acc + item.value, 0);

  const options: Highcharts.Options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      animation: true,
      spacingTop: 10,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      options3d: {
        enabled: true,
        alpha: 50,
        beta: 0,
      },
      style: {
        fontFamily: "var(--font-sans)",
      }
    },
    title: {
      text: undefined, 
    },
    accessibility: { enabled: false },
    credits: { enabled: false },
    exporting: { enabled: false },
    tooltip: {
      useHTML: true,
      backgroundColor: "var(--color-surface)",
      borderColor: "var(--color-border)",
      borderRadius: 12,
      borderWidth: 1,
      shadow: true,
      style: {
        fontSize: "14px",
        fontFamily: "var(--font-sans)",
        color: "var(--color-text-main)"
      },
      formatter: function() {
        // @ts-expect-error - Highcharts types missing or complex context
        const point = this.point as CustomPoint;
        const percentage = ((point.y ?? 0) / total) * 100;
        return `
          <div style="padding:8px">
            <b>${point.name}</b><br/>
            Total: <b>${point.formattedValue || point.y}</b><br/>
            Percentual: <b>${percentage.toFixed(1).replace(".", ",")}%</b>
          </div>
        `;
      }
    },
    plotOptions: {
      pie: {
        size: '70%',
        center: ['50%', '38%'],
        allowPointSelect: true,
        cursor: "pointer",
        depth: 55,
        showInLegend: true,
        slicedOffset: 12,
        borderWidth: 1.5,
        borderColor: "var(--color-surface)",
        // @ts-expect-error - 3D pie properties not in base types
        edgeWidth: 1,
        edgeColor: "rgba(0,0,0,0.5)",
        shadow: {
          color: "rgba(0,0,0,0.4)",
          offsetX: 0,
          offsetY: 15,
          opacity: 0.4,
          width: 15,
        },
        states: {
          inactive: { opacity: 1 },
          hover: {
            brightness: 0.15,
            halo: {
              size: 15,
              attributes: { fill: "rgba(255,255,255,0.2)" }
            }
          }
        },
        dataLabels: {
          enabled: false,
        },
        point: {
          events: {
            click: function(this: CustomPoint) {
              if (this.customData) {
                onClickSlice(this.customData);
              }
            }
          }
        }
      },
    },
    legend: {
      enabled: true,
      useHTML: true,
      align: 'center',
      verticalAlign: 'bottom',
      y: -15,
      itemStyle: {
        color: 'var(--color-text-main)',
        fontSize: '13px',
        fontWeight: 'bold',
        fontFamily: 'var(--font-sans)',
        paddingBottom: '4px'
      },
      itemHoverStyle: {
        color: 'var(--color-text-muted)'
      },
      labelFormatter: function() {
        const self = this as unknown as Highcharts.Point;
        const percentage = ((self.y ?? 0) / total) * 100;
        return `${self.name} <span style="opacity: 0.7; font-weight: normal; margin-left: 4px;">(${percentage.toFixed(1).replace(".", ",")}%)</span>`;
      },
    },
    series: [
      {
        type: "pie",
        data: data.map((item, index) => {
          const baseColor = HIGHCHARTS_COLORS[index % HIGHCHARTS_COLORS.length];
          const color2 = Highcharts.color(baseColor).brighten(-0.5).get('rgb');

          return {
            name: item.name,
            y: item.value,
            sliced: true, 
            formattedValue: metric === 'KM_TOTAL' ? `${item.value.toLocaleString('pt-BR')} km` : metric === 'EFICIENCIA' ? `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/l` : metric === 'CUSTO_KM' ? `${formatBRL(item.value)} / km` : formatBRL(item.value),
            customData: item,
            color: {
              radialGradient: {
                cx: 0.4,
                cy: 0.3,
                r: 0.9,
              },
              stops: [
                [0, Highcharts.color(baseColor).brighten(0.2).get('rgb')],
                [1, color2],
              ],
            }
          };
        })
      } as Highcharts.SeriesPieOptions
    ]
  };

  return (
    <div className="w-full h-full">
      <HighchartsReact 
        highcharts={Highcharts} 
        options={options} 
        containerProps={{ style: { height: "100%", width: "100%" } }}
      />
    </div>
  );
}
