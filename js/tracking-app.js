/* ============================================================
   tracking-app.js  —  Logika Vue.js untuk halaman tracking.html
   Mengacu pada template dataBahanAjar.js (Vue 2).
   ============================================================ */
   
var app = new Vue({
  el: '#app',

  data: {
    pengirimanList: window.UT_DATA.pengirimanList,
    paketList: window.UT_DATA.paket,
    stokRef: window.UT_DATA.stok,

    // ubah objek tracking dummy menjadi array agar mudah di-render
    daftarDO: Object.keys(window.UT_DATA.tracking).map(function (nomor) {
      var t = window.UT_DATA.tracking[nomor];
      return {
        nomor: nomor, nim: t.nim, nama: t.nama, status: t.status,
        ekspedisi: t.ekspedisi, tanggalKirim: t.tanggalKirim,
        paket: t.paket, total: t.total, perjalanan: t.perjalanan
      };
    }),

    doDipilih: null,

    form: {
      nim: '', nama: '', ekspedisi: 'JNE Regular (3-5 hari)',
      paketKode: '', tanggalKirim: ''
    },
    err: {},
    suksesDO: ''
  },

  computed: {
    // Nomor DO tergenerate otomatis: DO<tahun>-<urut 3 digit>
    nomorDOBerikutnya: function () {
      var tahun = new Date().getFullYear();
      var prefix = 'DO' + tahun + '-';
      var urutMax = 0;
      this.daftarDO.forEach(function (d) {
        if (d.nomor.indexOf(prefix) === 0) {
          var n = parseInt(d.nomor.replace(prefix, ''), 10);
          if (!isNaN(n) && n > urutMax) urutMax = n;
        }
      });
      return prefix + String(urutMax + 1).padStart(3, '0');
    },

    // objek paket yang sedang dipilih pada form
    paketTerpilih: function () {
      var kode = this.form.paketKode;
      return this.paketList.find(function (p) { return p.kode === kode; }) || null;
    },

    // detail isi paket: gabungkan kode + judul dari data stok
    detailIsiPaket: function () {
      if (!this.paketTerpilih) return [];
      var stok = this.stokRef;
      return this.paketTerpilih.isi.map(function (kode) {
        var s = stok.find(function (x) { return x.kode === kode; });
        return { kode: kode, judul: s ? s.judul : '(judul tidak ditemukan)' };
      });
    },

    // Total harga diambil dari paket → harga
    totalHarga: function () {
      return this.paketTerpilih ? this.paketTerpilih.harga : 0;
    },

    // DO yang sedang dibuka detailnya
    doAktif: function () {
      var nomor = this.doDipilih;
      return this.daftarDO.find(function (d) { return d.nomor === nomor; }) || null;
    },

    formValid: function () {
      var f = this.form;
      return !!f.nim && !!f.nama && !!f.ekspedisi &&
             !!f.paketKode && !!f.tanggalKirim;
    }
  },

  watch: {
    /* Watcher #1: ketika paket berubah, catat total harga terbaru
       (Total Harga mengikuti paket → harga secara reaktif). */
    'form.paketKode': function (kode) {
      console.log('[watch] Paket dipilih =', kode || '(belum dipilih)',
                  '→ total', this.totalHarga);
    },

    /* Watcher #2: pantau perubahan jumlah DO secara deep, mis.
       setelah menambah DO baru. */
    daftarDO: {
      deep: true,
      handler: function (baru) {
        console.log('[watch] Jumlah DO sekarang =', baru.length);
      }
    },

    /* Watcher #3: validasi NIM real-time (harus angka). */
    'form.nim': function (nilai) {
      if (nilai && !/^\d+$/.test(nilai))
        this.$set(this.err, 'nim', 'NIM hanya boleh berupa angka.');
      else
        this.$set(this.err, 'nim', '');
    }
  },

  methods: {
    rupiah: function (n) {
      return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
    },

    // ambil tanggal lokal hari ini (format yyyy-mm-dd)
    isiTanggalHariIni: function () {
      var d = new Date();
      var bln = String(d.getMonth() + 1).padStart(2, '0');
      var tgl = String(d.getDate()).padStart(2, '0');
      this.form.tanggalKirim = d.getFullYear() + '-' + bln + '-' + tgl;
    },

    pilihDO: function (nomor) {
      this.doDipilih = nomor;
    },

    validasiForm: function () {
      var f = this.form, e = {};
      if (!f.nim) e.nim = 'NIM wajib diisi.';
      else if (!/^\d+$/.test(f.nim)) e.nim = 'NIM hanya boleh berupa angka.';
      if (!f.nama) e.nama = 'Nama wajib diisi.';
      if (!f.paketKode) e.paketKode = 'Paket wajib dipilih.';
      this.err = e;
      return Object.keys(e).length === 0;
    },

    tambahDO: function () {
      if (!this.validasiForm()) return;
      var nomor = this.nomorDOBerikutnya;
      this.daftarDO.push({
        nomor: nomor,
        nim: this.form.nim,
        nama: this.form.nama,
        status: 'Diproses',
        ekspedisi: this.form.ekspedisi,
        tanggalKirim: this.form.tanggalKirim,
        paket: this.form.paketKode,
        total: this.totalHarga,
        perjalanan: [
          {
            waktu: new Date().toLocaleString('id-ID'),
            keterangan: 'DO dibuat dan menunggu proses pengiriman'
          }
        ]
      });
      this.suksesDO = nomor;
      this.doDipilih = nomor;
      this.form = {
        nim: '', nama: '', ekspedisi: 'JNE Regular (3-5 hari)',
        paketKode: '', tanggalKirim: ''
      };
      this.err = {};
    }
  }
});
