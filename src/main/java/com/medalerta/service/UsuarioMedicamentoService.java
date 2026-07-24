package com.medalerta.service;

import com.medalerta.model.UsuarioMedicamento;
import com.medalerta.model.UsuarioMedicamentoId;
import com.medalerta.repository.UsuarioMedicamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioMedicamentoService {

    @Autowired
    private UsuarioMedicamentoRepository repository;

    public List<UsuarioMedicamento> listarTodas() {
        return repository.findAll();
    }

    public List<UsuarioMedicamento> listarAlertasAtivos() {
        // Retorna apenas prescrições onde o status é PENDENTE e a dataHorarioAlerta já passou
        LocalDateTime agora = LocalDateTime.now();
        return repository.findByStatusAlerta("PENDENTE").stream()
                .filter(p -> p.getDataHorarioAlerta() != null && p.getDataHorarioAlerta().isBefore(agora))
                .collect(Collectors.toList());
    }

    public UsuarioMedicamento salvar(UsuarioMedicamento prescricao) {
        if (prescricao.getStatusAlerta() == null) {
            prescricao.setStatusAlerta("PENDENTE");
        }
        return repository.save(prescricao);
    }

    public Optional<UsuarioMedicamento> buscarPorId(UsuarioMedicamentoId id) {
        return repository.findById(id);
    }

    public void deletar(UsuarioMedicamentoId id) {
        repository.deleteById(id);
    }

    public UsuarioMedicamento confirmarConsumo(UsuarioMedicamentoId id) {
        Optional<UsuarioMedicamento> prescricaoOpt = repository.findById(id);
        if (prescricaoOpt.isPresent()) {
            UsuarioMedicamento p = prescricaoOpt.get();
            p.setStatusAlerta("CONSUMIDO");
            p.setDataHorarioConsumo(LocalDateTime.now());
            p.setConfirmacaoConsumo("SIM");
            return repository.save(p);
        }
        throw new RuntimeException("Prescrição não encontrada.");
    }
}
