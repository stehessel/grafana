package alerting

import (
	"math/rand"
	"sync"
	"testing"
	"time"

	"github.com/benbjohnson/clock"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/stretchr/testify/require"
)

func TestTicker(t *testing.T) {
	t.Run("should fail if interval is non-positive", func(t *testing.T) {
		clk := clock.NewMock()
		interval := time.Duration(rand.Int31n(100) + 10)
		require.Panicsf(t, func() {
			NewTicker(clk, -interval, prometheus.NewPedanticRegistry())
		}, "should panic because of negative interval but it doesn't")

		require.Panics(t, func() {
			NewTicker(clk, 0, prometheus.NewPedanticRegistry())
		}, "should panic because of 0 interval but it doesn't")
	})

	t.Run("should not drop ticks", func(t *testing.T) {
		clk := clock.NewMock()
		interval := time.Duration(rand.Int31n(100) + 10)
		ticker := NewTicker(clk, interval, prometheus.NewPedanticRegistry())

		ticks := rand.Intn(9) + 1
		jitter := rand.Int63n(int64(interval) - 1)

		clk.Add(time.Duration(ticks)*interval + time.Duration(jitter))

		w := sync.WaitGroup{}
		w.Add(1)
		regTicks := make([]time.Time, 0, ticks)
		go func() {
			for {
				timestamp := <-ticker.C
				regTicks = append(regTicks, timestamp)
				if len(regTicks) == ticks {
					w.Done()
				}
			}
		}()
		w.Wait()

		require.Len(t, regTicks, ticks)

		t.Run("ticks should monotonically increase", func(t *testing.T) {
			for i := 1; i < len(regTicks); i++ {
				previous := regTicks[i-1]
				current := regTicks[i]
				require.Equal(t, interval, current.Sub(previous))
			}
		})
	})
}
