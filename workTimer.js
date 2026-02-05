// workTimer.js - Sistema de Cronômetro de Trabalho em Segundo Plano
// Este arquivo deve ser incluído em todas as páginas para manter o timer sincronizado

const WorkTimer = {
  intervalId: null,
  displayElement: null,
  startBtn: null,
  stopBtn: null,
  floatingWidget: null,

  init() {
    // Tenta encontrar os elementos do timer principal (index.html)
    this.displayElement = document.getElementById('workTimerDisplay');
    this.startBtn = document.getElementById('startWorkBtn');
    this.stopBtn = document.getElementById('stopWorkBtn');

    // Se os botões existem, configura os listeners
    if (this.startBtn && this.stopBtn) {
      this.startBtn.addEventListener('click', () => this.start());
      this.stopBtn.addEventListener('click', () => this.stop());
    }

    // Cria o widget flutuante APENAS se há um timer ativo E não estamos na página com o timer principal
    const hasActiveTimer = localStorage.getItem('work_start_time');
    if (!this.displayElement && hasActiveTimer) {
      this.createFloatingWidget();
    }

    // Inicia a atualização do display
    this.updateDisplay();

    // Se há um timer ativo, inicia o intervalo
    if (hasActiveTimer) {
      this.intervalId = setInterval(() => this.updateDisplay(), 1000);
    }

    // Escuta eventos de storage para sincronizar entre abas
    window.addEventListener('storage', (e) => {
      if (e.key === 'work_start_time') {
        this.updateDisplay();
        if (e.newValue && !this.intervalId) {
          this.intervalId = setInterval(() => this.updateDisplay(), 1000);
          // Cria widget se não existe e não estamos na página principal
          if (!this.displayElement && !this.floatingWidget) {
            this.createFloatingWidget();
          }
        } else if (!e.newValue && this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
          this.updateDisplay();
          // Remove widget quando timer para
          if (this.floatingWidget) {
            this.floatingWidget.remove();
            this.floatingWidget = null;
          }
        }
      }
    });

    // Quando a página fica visível novamente, atualiza o display
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateDisplay();
      }
    });
  },

  createFloatingWidget() {
    // Verifica se já existe
    if (document.getElementById('workTimerFloatingWidget')) return;

    // Cria o widget flutuante
    const widget = document.createElement('div');
    widget.id = 'workTimerFloatingWidget';
    widget.innerHTML = `
      <div class="work-timer-floating-content">
        <span class="work-timer-floating-icon">💼</span>
        <span class="work-timer-floating-time" id="workTimerFloatingDisplay">00:00:00</span>
        <div class="work-timer-floating-actions">
          <button class="work-timer-floating-btn start" id="workTimerFloatingStart" title="Iniciar">▶</button>
          <button class="work-timer-floating-btn stop" id="workTimerFloatingStop" title="Parar" disabled>⏹</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    this.floatingWidget = widget;

    // Adiciona os estilos se ainda não existem
    if (!document.getElementById('workTimerFloatingStyles')) {
      const styles = document.createElement('style');
      styles.id = 'workTimerFloatingStyles';
      styles.textContent = `
        #workTimerFloatingWidget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #1e3a5f 0%, #0e2340 100%);
          border: 1px solid rgba(255, 221, 87, 0.3);
          border-radius: 50px;
          padding: 8px 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          transition: all 0.3s ease;
          display: none;
        }

        #workTimerFloatingWidget.active {
          display: block;
          animation: slideIn 0.3s ease;
        }

        #workTimerFloatingWidget:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .work-timer-floating-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .work-timer-floating-icon {
          font-size: 18px;
        }

        .work-timer-floating-time {
          font-size: 16px;
          font-weight: 700;
          color: #ffdd57;
          font-family: 'Courier New', monospace;
          min-width: 70px;
          text-align: center;
        }

        .work-timer-floating-actions {
          display: flex;
          gap: 5px;
        }

        .work-timer-floating-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .work-timer-floating-btn.start {
          background: #4ade80;
          color: #000;
        }

        .work-timer-floating-btn.start:hover:not(:disabled) {
          background: #22c55e;
          transform: scale(1.1);
        }

        .work-timer-floating-btn.stop {
          background: #f87171;
          color: #000;
        }

        .work-timer-floating-btn.stop:hover:not(:disabled) {
          background: #ef4444;
          transform: scale(1.1);
        }

        .work-timer-floating-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Animação pulsante quando ativo */
        #workTimerFloatingWidget.running {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(255, 221, 87, 0.4);
          }
        }

        /* Responsivo */
        @media (max-width: 600px) {
          #workTimerFloatingWidget {
            bottom: 70px;
            right: 10px;
            padding: 6px 12px;
          }

          .work-timer-floating-time {
            font-size: 14px;
          }

          .work-timer-floating-btn {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // Listeners para os botões do widget flutuante
    const floatingStartBtn = document.getElementById('workTimerFloatingStart');
    const floatingStopBtn = document.getElementById('workTimerFloatingStop');

    if (floatingStartBtn) {
      floatingStartBtn.addEventListener('click', () => this.start());
    }
    if (floatingStopBtn) {
      floatingStopBtn.addEventListener('click', () => this.stop());
    }
  },

  formatTime(ms) {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  updateDisplay() {
    const startTime = localStorage.getItem('work_start_time');
    const isRunning = !!startTime;
    
    let timeText = '00:00:00';
    let isOverLimit = false;

    if (isRunning) {
      let diff = Date.now() - parseInt(startTime);
      
      // Limite visual de 48 horas
      const maxDuration = 48 * 60 * 60 * 1000;
      if (diff >= maxDuration) {
        diff = maxDuration;
        isOverLimit = true;
      }
      
      timeText = this.formatTime(diff);
    }

    // Atualiza o display principal (se existir)
    if (this.displayElement) {
      this.displayElement.textContent = timeText;
      this.displayElement.style.color = isOverLimit ? '#f87171' : '';
    }

    // Atualiza os botões principais
    if (this.startBtn && this.stopBtn) {
      this.startBtn.disabled = isRunning;
      this.startBtn.style.opacity = isRunning ? '0.5' : '1';
      this.stopBtn.disabled = !isRunning;
      this.stopBtn.style.opacity = isRunning ? '1' : '0.5';
    }

    // Atualiza o widget flutuante
    const floatingDisplay = document.getElementById('workTimerFloatingDisplay');
    const floatingStartBtn = document.getElementById('workTimerFloatingStart');
    const floatingStopBtn = document.getElementById('workTimerFloatingStop');
    const floatingWidget = document.getElementById('workTimerFloatingWidget');

    if (floatingWidget) {
      // Mostra o widget se o timer está rodando ou se estamos em outra página
      if (isRunning || !this.displayElement) {
        floatingWidget.classList.add('active');
        
        if (isRunning) {
          floatingWidget.classList.add('running');
        } else {
          floatingWidget.classList.remove('running');
        }
      } else {
        floatingWidget.classList.remove('active', 'running');
      }
    }

    if (floatingDisplay) {
      floatingDisplay.textContent = timeText;
      floatingDisplay.style.color = isOverLimit ? '#f87171' : '#ffdd57';
    }

    if (floatingStartBtn && floatingStopBtn) {
      floatingStartBtn.disabled = isRunning;
      floatingStopBtn.disabled = !isRunning;
    }
  },

  start() {
    localStorage.setItem('work_start_time', Date.now().toString());
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => this.updateDisplay(), 1000);
    this.updateDisplay();
    
    // Dispara um evento customizado para outras partes do app
    window.dispatchEvent(new CustomEvent('workTimerStarted', { 
      detail: { startTime: Date.now() } 
    }));
  },

  stop() {
    const startTime = parseInt(localStorage.getItem('work_start_time'));
    
    if (startTime) {
      // Chama a função de salvar sessão se existir
      if (typeof window.finishWorkSession === 'function') {
        window.finishWorkSession(startTime);
      }
      
      localStorage.removeItem('work_start_time');
      
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      this.updateDisplay();
      
      // Dispara um evento customizado
      window.dispatchEvent(new CustomEvent('workTimerStopped', { 
        detail: { startTime: startTime, endTime: Date.now() } 
      }));
    }
  },

  // Método para verificar se o timer está ativo
  isRunning() {
    return !!localStorage.getItem('work_start_time');
  },

  // Método para obter o tempo decorrido em ms
  getElapsedTime() {
    const startTime = localStorage.getItem('work_start_time');
    if (!startTime) return 0;
    return Date.now() - parseInt(startTime);
  }
};

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WorkTimer.init());
} else {
  WorkTimer.init();
}

// Expõe globalmente para uso em outras partes do app
window.WorkTimer = WorkTimer;
