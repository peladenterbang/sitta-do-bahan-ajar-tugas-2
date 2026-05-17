/* ============================================================
   stok-app.js  —  Logika Vue.js untuk halaman stok.html
   Mengacu pada template dataBahanAjar.js (Vue 2).
   ============================================================ */
var app = new Vue({
  el: '#app',

  data: {
    // sumber data (disalin agar bisa diedit tanpa mengubah dummy asli)
    stokList: JSON.parse(JSON.stringify(window.UT_DATA.stok)),
    upbjjList: window.UT_DATA.upbjjList,
    kategoriList: window.UT_DATA.kategoriList,

    // state filter & sort (two-way binding via v-model)
    filter: { upbjj: '', kategori: '', reorder: false },
    sort: { by: '', dir: 'asc' },

    // state edit inline
    editKode: null,
    formEdit: {},

    // state form tambah
    formBaru: {
      kode: '', judul: '', kategori: 'MK Wajib', upbjj: 'Jakarta',
      lokasiRak: '', harga: null, qty: null, safety: null, catatanHTML: ''
    },
    errBaru: {},
    suksesTambah: ''
  },

  computed: {
    /* Computed → otomatis ter-cache, tidak recompute jika dependensi
       tidak berubah (sesuai permintaan: filter tanpa recompute ulang). */

    // dependent options: kategori yang tersedia pada UT-Daerah terpilih
    kategoriTersedia: function () {
      if (!this.filter.upbjj) return this.kategoriList;
      var kat = this.stokList
        .filter(function (s) { return s.upbjj === this.filter.upbjj; }, this)
        .map(function (s) { return s.kategori; });
      return [...new Set(kat)];
    },

    // hasil akhir: filter + sort
    stokTampil: function () {
      var hasil = this.stokList.filter(function (s) {
        var okUpbjj = !this.filter.upbjj || s.upbjj === this.filter.upbjj;
        var okKat = !this.filter.kategori || s.kategori === this.filter.kategori;
        var okReorder = !this.filter.reorder || s.qty === 0 || s.qty < s.safety;
        return okUpbjj && okKat && okReorder;
      }, this);

      if (this.sort.by) {
        var arah = this.sort.dir === 'desc' ? -1 : 1;
        var key = this.sort.by;
        hasil = hasil.slice().sort(function (a, b) {
          if (key === 'judul') return a.judul.localeCompare(b.judul) * arah;
          return (a[key] - b[key]) * arah;
        });
      }
      return hasil;
    },

    // ringkasan jumlah status
    ringkasan: function () {
      var r = { total: this.stokList.length, aman: 0, menipis: 0, kosong: 0 };
      this.stokList.forEach(function (s) {
        if (s.qty === 0) r.kosong++;
        else if (s.qty < s.safety) r.menipis++;
        else r.aman++;
      });
      return r;
    },

    // validasi form tambah
    formValid: function () {
      var f = this.formBaru;
      return !!f.kode && !!f.judul &&
             typeof f.harga === 'number' && f.harga > 0 &&
             typeof f.qty === 'number' && f.qty >= 0 &&
             typeof f.safety === 'number' && f.safety >= 0;
    }
  },

  watch: {
    /* Watcher #1: ketika UT-Daerah berubah, reset pilihan kategori
       agar dependent option selalu konsisten. */
    'filter.upbjj': function (baru) {
      this.filter.kategori = '';
      console.log('[watch] Filter UT-Daerah →', baru || '(semua)');
    },

    /* Watcher #2: pantau perubahan data stok (mis. setelah edit /
       tambah) secara deep, lalu catat ke konsol untuk audit. */
    stokList: {
      deep: true,
      handler: function (baru) {
        console.log('[watch] Data stok berubah. Total judul =', baru.length);
      }
    },

    /* Watcher #3: bantu pengguna — saat mode re-order diaktifkan,
       urutan otomatis diset ke stok menaik. */
    'filter.reorder': function (aktif) {
      if (aktif) { this.sort.by = 'qty'; this.sort.dir = 'asc'; }
    }
  },

  methods: {
    // tentukan status stok (dipakai untuk teks + warna)
    statusStok: function (item) {
      if (item.qty === 0)
        return { label: 'Kosong',  kelas: 'kosong'  };
      if (item.qty < item.safety)
        return { label: 'Menipis', kelas: 'menipis' };
      return { label: 'Aman', kelas: 'aman' };
    },

    rupiah: function (n) {
      return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    },

    resetFilter: function () {
      this.filter = { upbjj: '', kategori: '', reorder: false };
      this.sort = { by: '', dir: 'asc' };
    },

    // ---- Edit stok ----
    mulaiEdit: function (item) {
      this.editKode = item.kode;
      this.formEdit = Object.assign({}, item);
    },
    batalEdit: function () {
      this.editKode = null;
      this.formEdit = {};
    },
    simpanEdit: function (item) {
      var idx = this.stokList.findIndex(function (s) { return s.kode === item.kode; });
      if (idx !== -1) {
        this.stokList.splice(idx, 1, Object.assign({}, this.stokList[idx], {
          judul: this.formEdit.judul,
          kategori: this.formEdit.kategori,
          upbjj: this.formEdit.upbjj,
          lokasiRak: this.formEdit.lokasiRak,
          qty: Number(this.formEdit.qty),
          safety: Number(this.formEdit.safety),
          harga: Number(this.formEdit.harga),
          catatanHTML: this.formEdit.catatanHTML
        }));
      }
      this.batalEdit();
    },

    // ---- Tambah bahan ajar + validasi sederhana ----
    validasiBaru: function () {
      var f = this.formBaru, e = {};
      if (!f.kode) e.kode = 'Kode wajib diisi.';
      else if (this.stokList.some(function (s) { return s.kode === f.kode; }))
        e.kode = 'Kode sudah terdaftar.';
      if (!f.judul) e.judul = 'Judul wajib diisi.';
      if (!(f.harga > 0)) e.harga = 'Harga harus lebih dari 0.';
      if (!(f.qty >= 0) || f.qty === null) e.qty = 'Stok minimal 0.';
      if (!(f.safety >= 0) || f.safety === null) e.safety = 'Safety minimal 0.';
      this.errBaru = e;
      return Object.keys(e).length === 0;
    },

    tambahBahanAjar: function () {
      if (!this.validasiBaru()) return;
      var f = this.formBaru;
      this.stokList.push({
        kode: f.kode,
        judul: f.judul,
        kategori: f.kategori,
        upbjj: f.upbjj,
        lokasiRak: f.lokasiRak || '-',
        harga: Number(f.harga),
        qty: Number(f.qty),
        safety: Number(f.safety),
        catatanHTML: f.catatanHTML || '<span class="muted">—</span>'
      });
      this.suksesTambah = f.kode;
      // reset form
      this.formBaru = {
        kode: '', judul: '', kategori: 'MK Wajib', upbjj: 'Jakarta',
        lokasiRak: '', harga: null, qty: null, safety: null, catatanHTML: ''
      };
      this.errBaru = {};
    }
  }
});
