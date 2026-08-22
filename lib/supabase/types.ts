export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      poin_siswa: {
        Row: {
          id: string
          siswa_id: string | null
          jenis: string
          kategori: string
          keterangan: string
          poin: number
          tanggal: string
          dicatat_oleh: string | null
          bukti_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          siswa_id?: string | null
          jenis: string
          kategori: string
          keterangan: string
          poin: number
          tanggal?: string
          dicatat_oleh?: string | null
          bukti_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          siswa_id?: string | null
          jenis?: string
          kategori?: string
          keterangan?: string
          poin?: number
          tanggal?: string
          dicatat_oleh?: string | null
          bukti_url?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      master_poin: {
        Row: {
          id: string
          jenis: string
          kategori: string
          nama_item: string
          bobot_poin: number
          created_at: string
        }
        Insert: {
          id?: string
          jenis: string
          kategori: string
          nama_item: string
          bobot_poin: number
          created_at?: string
        }
        Update: {
          id?: string
          jenis?: string
          kategori?: string
          nama_item?: string
          bobot_poin?: number
          created_at?: string
        }
      },
      pengajuan_magang: {
        Row: {
          id: string
          siswa_id: string | null
          dudika_id: string | null
          status: string
          catatan: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          siswa_id?: string | null
          dudika_id?: string | null
          status?: string
          catatan?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          siswa_id?: string | null
          dudika_id?: string | null
          status?: string
          catatan?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      absensi: {
        Row: {
          created_at: string
          id: string
          jam_1: boolean | null
          jam_10: boolean | null
          jam_11: boolean | null
          jam_12: boolean | null
          jam_2: boolean | null
          jam_3: boolean | null
          jam_4: boolean | null
          jam_5: boolean | null
          jam_6: boolean | null
          jam_7: boolean | null
          jam_8: boolean | null
          jam_9: boolean | null
          keterangan: string | null
          siswa_id: string | null
          status: string | null
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jam_1?: boolean | null
          jam_10?: boolean | null
          jam_11?: boolean | null
          jam_12?: boolean | null
          jam_2?: boolean | null
          jam_3?: boolean | null
          jam_4?: boolean | null
          jam_5?: boolean | null
          jam_6?: boolean | null
          jam_7?: boolean | null
          jam_8?: boolean | null
          jam_9?: boolean | null
          keterangan?: string | null
          siswa_id?: string | null
          status?: string | null
          tanggal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jam_1?: boolean | null
          jam_10?: boolean | null
          jam_11?: boolean | null
          jam_12?: boolean | null
          jam_2?: boolean | null
          jam_3?: boolean | null
          jam_4?: boolean | null
          jam_5?: boolean | null
          jam_6?: boolean | null
          jam_7?: boolean | null
          jam_8?: boolean | null
          jam_9?: boolean | null
          keterangan?: string | null
          siswa_id?: string | null
          status?: string | null
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      absensi_guru: {
        Row: {
          created_at: string
          foto_url: string | null
          guru_id: string | null
          id: string
          jenis_absensi: string | null
          keterangan: string | null
          status: string | null
          tanggal: string
          updated_at: string
          waktu_absen: string | null
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          guru_id?: string | null
          id?: string
          jenis_absensi?: string | null
          keterangan?: string | null
          status?: string | null
          tanggal: string
          updated_at?: string
          waktu_absen?: string | null
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          guru_id?: string | null
          id?: string
          jenis_absensi?: string | null
          keterangan?: string | null
          status?: string | null
          tanggal?: string
          updated_at?: string
          waktu_absen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absensi_guru_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      absensi_siswa_magang: {
        Row: {
          alamat_lokasi: string | null
          created_at: string
          foto_url: string | null
          id: string
          jenis_absensi: string | null
          keterangan: string | null
          lokasi_lat: number | null
          lokasi_lng: number | null
          siswa_id: string | null
          status: string | null
          tanggal: string
          updated_at: string
          waktu_absen: string
        }
        Insert: {
          alamat_lokasi?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          jenis_absensi?: string | null
          keterangan?: string | null
          lokasi_lat?: number | null
          lokasi_lng?: number | null
          siswa_id?: string | null
          status?: string | null
          tanggal?: string
          updated_at?: string
          waktu_absen?: string
        }
        Update: {
          alamat_lokasi?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          jenis_absensi?: string | null
          keterangan?: string | null
          lokasi_lat?: number | null
          lokasi_lng?: number | null
          siswa_id?: string | null
          status?: string | null
          tanggal?: string
          updated_at?: string
          waktu_absen?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_siswa_magang_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      jurnal_mengajar: {
        Row: {
          alamat_lokasi: string | null
          created_at: string
          foto_kegiatan_url: string | null
          guru_id: string
          id: string
          jam_mapel: string
          kelas: string
          lokasi_lat: number | null
          lokasi_lng: number | null
          mata_pelajaran: string
          materi: string
          nama_guru: string
          siswa_alfa: string[] | null
          siswa_izin: string[] | null
          siswa_sakit: string[] | null
          tanggal: string
          updated_at: string
        }
        Insert: {
          alamat_lokasi?: string | null
          created_at?: string
          foto_kegiatan_url?: string | null
          guru_id: string
          id?: string
          jam_mapel: string
          kelas: string
          lokasi_lat?: number | null
          lokasi_lng?: number | null
          mata_pelajaran: string
          materi: string
          nama_guru: string
          siswa_alfa?: string[] | null
          siswa_izin?: string[] | null
          siswa_sakit?: string[] | null
          tanggal?: string
          updated_at?: string
        }
        Update: {
          alamat_lokasi?: string | null
          created_at?: string
          foto_kegiatan_url?: string | null
          guru_id?: string
          id?: string
          jam_mapel?: string
          kelas?: string
          lokasi_lat?: number | null
          lokasi_lng?: number | null
          mata_pelajaran?: string
          materi?: string
          nama_guru?: string
          siswa_alfa?: string[] | null
          siswa_izin?: string[] | null
          siswa_sakit?: string[] | null
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      pemberitahuan: {
        Row: {
          aktif: boolean
          created_at: string
          created_by: string | null
          id: string
          isi: string
          judul: string
          tanggal_mulai: string
          tanggal_selesai: string | null
          tipe: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          isi: string
          judul: string
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          tipe?: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          isi?: string
          judul?: string
          tanggal_mulai?: string
          tanggal_selesai?: string | null
          tipe?: string
          updated_at?: string
        }
        Relationships: []
      }
      peminjaman_barang: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          kelas: string | null
          mulai_jam: number
          nama_alat: string
          nama_guru: string
          nama_siswa: string | null
          sampai_jam: number
          status: string | null
          tanggal_peminjaman: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          kelas?: string | null
          mulai_jam: number
          nama_alat: string
          nama_guru: string
          nama_siswa?: string | null
          sampai_jam: number
          status?: string | null
          tanggal_peminjaman?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          kelas?: string | null
          mulai_jam?: number
          nama_alat?: string
          nama_guru?: string
          nama_siswa?: string | null
          sampai_jam?: number
          status?: string | null
          tanggal_peminjaman?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rombel: {
        Row: {
          created_at: string
          id: string
          nama_rombel: string
          tahun_ajaran: string | null
          updated_at: string
          wali_kelas: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nama_rombel: string
          tahun_ajaran?: string | null
          updated_at?: string
          wali_kelas?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama_rombel?: string
          tahun_ajaran?: string | null
          updated_at?: string
          wali_kelas?: string | null
        }
        Relationships: []
      }
      siswa: {
        Row: {
          created_at: string
          id: string
          nama: string
          nisn: string
          rombel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          nisn: string
          rombel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          nisn?: string
          rombel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_rombel_id_fkey"
            columns: ["rombel_id"]
            isOneToOne: false
            referencedRelation: "rombel"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          email: string
          id: string
          nama: string
          role: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          nama: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nama?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "guru" | "siswa" | "kepala_sekolah" | "operator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "guru", "siswa", "kepala_sekolah", "operator"],
    },
  },
} as const
