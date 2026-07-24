package com.medalerta.repository;

import com.medalerta.model.UsuarioMedicamento;
import com.medalerta.model.UsuarioMedicamentoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsuarioMedicamentoRepository extends JpaRepository<UsuarioMedicamento, UsuarioMedicamentoId> {
    
    // Buscar todas as prescrições de um paciente
    List<UsuarioMedicamento> findByUsuarioIdUsuario(Integer idUsuario);
    
    // Buscar todos os alertas atrasados pendentes (statusAlerta = "PENDENTE" e dataHorarioAlerta antes de Agora)
    List<UsuarioMedicamento> findByStatusAlerta(String statusAlerta);
}
