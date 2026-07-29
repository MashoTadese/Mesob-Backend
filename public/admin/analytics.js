var API = window.location.origin + '/api';
var token = localStorage.getItem('mesob_admin_token');
if (!token) window.location.href = 'login.html';

function logout() { localStorage.removeItem('mesob_admin_token'); window.location.href = 'login.html'; }

var COLORS = ['#1E3578','#F5C400','#059669','#dc2626','#7c3aed','#0891b2','#d97706','#be185d'];

async function loadAnalytics() {
  try {
    // Load stats
    var statsRes  = await fetch(API + '/complaints/stats', { headers: { Authorization: 'Bearer ' + token } });
    var statsData = await statsRes.json();
    if (statsData.success) {
      var s = statsData.data;
      document.getElementById('sTotal').textContent    = s.total;
      document.getElementById('sPending').textContent  = s.pending;
      document.getElementById('sResolved').textContent = s.resolved;
      document.getElementById('sReview').textContent   = s.underReview;
    }

    // Load analytics
    var res  = await fetch(API + '/complaints/analytics', { headers: { Authorization: 'Bearer ' + token } });
    var data = await res.json();
    if (!data.success) return;
    var d = data.data;

    // By Type chart
    new Chart(document.getElementById('typeChart'), {
      type: 'bar',
      data: {
        labels: d.byType.map(function(x) { return x._id; }),
        datasets: [{ label: 'Complaints', data: d.byType.map(function(x) { return x.count; }), backgroundColor: COLORS, borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    // By Status doughnut
    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: d.byStatus.map(function(x) { return x._id.replace('_',' '); }),
        datasets: [{ data: d.byStatus.map(function(x) { return x.count; }), backgroundColor: ['#fef3c7','#dbeafe','#d1fae5','#fee2e2'], borderWidth: 2 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Monthly trend line chart
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var monthLabels = d.byMonth.map(function(x) { return months[x._id.month - 1] + ' ' + x._id.year; }).reverse();
    var monthCounts = d.byMonth.map(function(x) { return x.count; }).reverse();
    new Chart(document.getElementById('monthChart'), {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Complaints',
          data: monthCounts,
          borderColor: '#1E3578',
          backgroundColor: 'rgba(30,53,120,0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#F5C400',
          pointRadius: 5
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    // By Department horizontal bar
    new Chart(document.getElementById('deptChart'), {
      type: 'bar',
      data: {
        labels: d.byDept.map(function(x) { return x._id; }),
        datasets: [{ label: 'Complaints', data: d.byDept.map(function(x) { return x.count; }), backgroundColor: '#1E3578', borderRadius: 6 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

  } catch(e) {
    console.error('Analytics error:', e);
  }
}

loadAnalytics();

