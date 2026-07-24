package com.medalerta.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "UsuarioMedicamento")
@IdClass(UsuarioMedicamentoId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioMedicamento {

    @Id
    @ManyToOne
    @JoinColumn(name = "idUsuario")
    private Usuario usuario;

    @Id
    @ManyToOne
    @JoinColumn(name = "idMedicamento")
    private Medicamento medicamento;

    private LocalTime horarioUso;
    private String frequenciaUso;
    private String dosagem;
    private LocalDateTime dataHorarioAlerta;
    
    // Status pode ser enum, vamos usar String inicialmente
    private String statusAlerta;
    
    private LocalDateTime dataHorarioConsumo;
    private String confirmacaoConsumo;
}
